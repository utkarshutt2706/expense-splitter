interface PlaceholderPageProps {
    title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
    return (
        <div className="p-8">
            <p className="font-display text-2xl">{title}</p>
        </div>
    );
}
