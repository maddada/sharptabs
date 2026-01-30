/// <reference types="react" />

declare module "@/components/ui/button" {
    export const Button: React.ForwardRefExoticComponent<
        React.ButtonHTMLAttributes<HTMLButtonElement> & {
            ref?: React.Ref<HTMLButtonElement>;
            variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
            size?: "default" | "sm" | "lg" | "icon";
            asChild?: boolean;
        }
    >;
}

declare module "@/components/ui/card" {
    export const Card: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement>>;
    export const CardHeader: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement>>;
    export const CardFooter: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement>>;
    export const CardTitle: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement>>;
    export const CardDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement>>;
    export const CardContent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement>>;
}
