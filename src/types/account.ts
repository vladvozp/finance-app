export interface Account {
    id: string;
    name: string;
    currency: string;

    openingBalance?: number;
    openingDate: string | null;

    snapshotBalance?: number;
    snapshotAt?: string | null;

    archived: boolean;
    createdAt: string;
    updatedAt: string;
    isMain?: boolean;
}
