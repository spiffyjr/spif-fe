export interface Tag {
    name: string;
    text?: string;
    attrs?: { [name: string]: string };
    children?: {
        name: string;
        start: number;
        end: number;
        text?: string;
        attrs?: { [name: string]: string };
    }[];
}
