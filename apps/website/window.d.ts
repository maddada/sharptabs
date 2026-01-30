declare global {
    interface Window {
        selectedPlan: {
            plan: string | null;
            price: string | null;
        };
    }
}

export {};
