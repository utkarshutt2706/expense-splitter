interface PlaceholderPageProps {
    title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
    return <p className="font-display text-2xl">{title}</p>;
}
