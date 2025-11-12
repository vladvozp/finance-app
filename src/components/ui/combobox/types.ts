import { type IconSpec } from "../../IconRenderer";

export type ComboOption = { id: string; name: string; icon?: IconSpec };

export type ComboboxProps<T extends ComboOption> = {
    label: string;
    placeholder?: string;
    options: T[];
    value: string;
    onChange?: (id: string, option?: T) => void;
    disabled?: boolean;
    required?: boolean;
    helperText?: string;
    allowCreate?: boolean;
    onCreate?: (name: string) => void;
    allowEdit?: boolean;
    onEdit?: (id: string, newName: string) => void;
    onDelete?: (id: string) => void;
    inputRef?: React.Ref<HTMLInputElement>;
};
