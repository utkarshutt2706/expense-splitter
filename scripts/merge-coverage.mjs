import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const OUTPUT_DIRECTORY = 'coverage';
const VITE_CONFIG = 'vite.config.ts';

const fail = (message) => {
    throw new Error(message);
};

const assertSameMap = (left, right, filename, kind) => {
    if (JSON.stringify(left) !== JSON.stringify(right)) {
        fail(`Coverage ${kind} differs between shards for ${filename}`);
    }
};

const addCounters = (target, source) => {
    for (const [key, value] of Object.entries(source)) {
        if (Array.isArray(value)) {
            const current = target[key];
            if (!Array.isArray(current) || current.length !== value.length) {
                fail(`Coverage branch counters differ at key ${key}`);
            }
            target[key] = current.map((count, index) => count + value[index]);
        } else {
            target[key] = (target[key] ?? 0) + value;
        }
    }
};

const mergeFileCoverage = (target, source, filename) => {
    assertSameMap(target.statementMap, source.statementMap, filename, 'statement map');
    assertSameMap(target.fnMap, source.fnMap, filename, 'function map');
    assertSameMap(target.branchMap, source.branchMap, filename, 'branch map');
    addCounters(target.s, source.s);
    addCounters(target.f, source.f);
    addCounters(target.b, source.b);
};

const summarize = (counts) => {
    const values = Array.isArray(counts) ? counts : Object.values(counts);
    const total = values.length;
    const covered = values.filter((value) => value > 0).length;
    return {
        total,
        covered,
        skipped: 0,
        pct: total === 0 ? 100 : Math.floor((covered / total) * 10_000) / 100,
    };
};

const lineCounts = (coverage) => {
    const lines = new Map();
    for (const [key, count] of Object.entries(coverage.s)) {
        const line = coverage.statementMap[key].start.line;
        lines.set(line, Math.max(lines.get(line) ?? 0, count));
    }
    return lines;
};

const fileSummary = (coverage) => ({
    lines: summarize([...lineCounts(coverage).values()]),
    statements: summarize(coverage.s),
    functions: summarize(coverage.f),
    branches: summarize(Object.values(coverage.b).flat()),
});

const totalSummary = (coverages) => {
    const totals = Object.fromEntries(
        ['lines', 'statements', 'functions', 'branches'].map((metric) => [
            metric,
            { total: 0, covered: 0, skipped: 0, pct: 100 },
        ]),
    );

    for (const coverage of coverages) {
        const summary = fileSummary(coverage);
        for (const metric of Object.keys(totals)) {
            totals[metric].total += summary[metric].total;
            totals[metric].covered += summary[metric].covered;
        }
    }

    for (const metric of Object.keys(totals)) {
        const { total, covered } = totals[metric];
        totals[metric].pct = total === 0 ? 100 : Math.floor((covered / total) * 10_000) / 100;
    }
    return totals;
};

const toLcov = (filename, coverage) => {
    const relativeFilename = path.relative(process.cwd(), filename).split(path.sep).join('/');
    const lines = ['TN:', `SF:${relativeFilename}`];
    for (const [key, fn] of Object.entries(coverage.fnMap)) {
        lines.push(`FN:${fn.decl.start.line},${fn.name || `(anonymous_${key})`}`);
    }
    const functionCounts = Object.values(coverage.f);
    lines.push(`FNF:${functionCounts.length}`);
    lines.push(`FNH:${functionCounts.filter((count) => count > 0).length}`);
    for (const [key, fn] of Object.entries(coverage.fnMap)) {
        lines.push(`FNDA:${coverage.f[key]},${fn.name || `(anonymous_${key})`}`);
    }

    for (const [line, count] of [...lineCounts(coverage)].sort(([a], [b]) => a - b)) {
        lines.push(`DA:${line},${count}`);
    }
    const lineValues = [...lineCounts(coverage).values()];
    lines.push(`LF:${lineValues.length}`);
    lines.push(`LH:${lineValues.filter((count) => count > 0).length}`);

    let branchTotal = 0;
    let branchCovered = 0;
    for (const [key, branch] of Object.entries(coverage.branchMap)) {
        coverage.b[key].forEach((count, index) => {
            branchTotal += 1;
            branchCovered += Number(count > 0);
            lines.push(`BRDA:${branch.loc.start.line},${key},${index},${count}`);
        });
    }
    lines.push(`BRF:${branchTotal}`);
    lines.push(`BRH:${branchCovered}`);
    lines.push('end_of_record');
    return lines.join('\n');
};

const readThresholds = async () => {
    const config = await readFile(VITE_CONFIG, 'utf8');
    const block = config.match(/thresholds:\s*{(?<thresholds>[^}]+)}/)?.groups?.thresholds;
    if (!block) fail(`Coverage thresholds not found in ${VITE_CONFIG}`);

    return Object.fromEntries(
        ['lines', 'functions', 'branches', 'statements'].map((metric) => {
            const value = block.match(new RegExp(`${metric}:\\s*(?<value>\\d+)`))?.groups?.value;
            if (!value) fail(`Coverage threshold for ${metric} not found in ${VITE_CONFIG}`);
            return [metric, Number(value)];
        }),
    );
};

const reportThresholds = (summary, thresholds) => {
    let failed = false;
    for (const metric of ['lines', 'functions', 'branches', 'statements']) {
        const percentage = summary[metric].pct;
        const threshold = thresholds[metric];
        console.log(`${metric.padEnd(10)} ${percentage.toFixed(2)}%`);
        if (percentage < threshold) {
            console.error(`${metric} coverage ${percentage}% is below ${threshold}%`);
            failed = true;
        }
    }
    if (failed) process.exitCode = 1;
};

const inputPaths = process.argv.slice(2);
if (inputPaths.length !== 4) {
    fail(`Expected 4 coverage shards, received ${inputPaths.length}`);
}

const merged = {};
for (const inputPath of inputPaths) {
    const shard = JSON.parse(await readFile(inputPath, 'utf8'));
    for (const [filename, coverage] of Object.entries(shard)) {
        if (merged[filename]) mergeFileCoverage(merged[filename], coverage, filename);
        else merged[filename] = structuredClone(coverage);
    }
}

const summaries = Object.fromEntries(
    Object.entries(merged).map(([filename, coverage]) => [filename, fileSummary(coverage)]),
);
summaries.total = totalSummary(Object.values(merged));

await mkdir(OUTPUT_DIRECTORY, { recursive: true });
await Promise.all([
    writeFile(path.join(OUTPUT_DIRECTORY, 'coverage-final.json'), JSON.stringify(merged)),
    writeFile(path.join(OUTPUT_DIRECTORY, 'coverage-summary.json'), JSON.stringify(summaries)),
    writeFile(
        path.join(OUTPUT_DIRECTORY, 'lcov.info'),
        `${Object.entries(merged)
            .map(([filename, coverage]) => toLcov(filename, coverage))
            .join('\n')}\n`,
    ),
]);

reportThresholds(summaries.total, await readThresholds());
