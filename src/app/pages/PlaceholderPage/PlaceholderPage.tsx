type PlaceholderPageProps = Readonly<{
    title: string;
}>;

export function PlaceholderPage({ title }: PlaceholderPageProps) {
    return <p className="text-2xl">{title}</p>;
}
