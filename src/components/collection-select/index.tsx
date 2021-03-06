import * as React from 'react';
import { Select } from '@rmwc/select';
import { useCallback } from 'react';

export interface ICollectionListProps {
    readonly label: string;
    readonly items: { name: string, id: string }[];
    readonly onChange: (value: string) => void;
    readonly value: string | undefined;
}

export const CollectionSelect = (props: ICollectionListProps) => {
    const { items, value, label, onChange: onValueChange } = props;
    const listItems = items.map(i =>
        <option value={i.id} key={i.id}>{i.name}</option>
    );

    const onChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        onValueChange(event.currentTarget.value);
    }, [onValueChange])

    return (
        <Select value={value} outlined={true} label={label} onChange={onChange}>
            <option value=""></option>
            {listItems}
        </Select>
    );
};
