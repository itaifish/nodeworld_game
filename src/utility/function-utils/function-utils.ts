/**
 * This function merges `dataToUpdate`'s fields into `data`, while preserving the rest of `data`'s fields. The modification is made in-place, and then the same object is returned
 * @param data The object that is being updated
 * @param dataToUpdate the updates to make
 * @returns reference to `data`
 */
export function mergeInto<TData>(data: TData, dataToUpdate: Partial<TData>) {
	for (const key of Object.keys(dataToUpdate)) {
		const typedKey = key as keyof TData;
		if (typeof data[typedKey] === 'object') {
			mergeInto(data[typedKey], dataToUpdate[typedKey] as Partial<TData[keyof TData]>);
		} else {
			data[typedKey] = dataToUpdate[typedKey] as TData[keyof TData];
		}
	}
	return data;
}
