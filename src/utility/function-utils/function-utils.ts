/**
 * This function merges `dataToUpdate`'s fields into `data`, while preserving the rest of `data`'s fields. The modification is made in-place, and then the same object is returned
 * @param data The object that is being updated
 * @param dataToUpdate the updates to make
 * @returns reference to `data`
 */
export function mergeInto<TData>(data: TData, dataToUpdate: Partial<TData>) {
	if (data == null || dataToUpdate == null) {
		return data;
	}

	for (const key of Object.keys(dataToUpdate)) {
		const typedKey = key as keyof TData;
		if (typeof data[typedKey] === 'object' && !(data[typedKey] instanceof Date)) {
			mergeInto(data[typedKey], dataToUpdate[typedKey] as Partial<TData[keyof TData]>);
		} else {
			data[typedKey] = dataToUpdate[typedKey] as NonNullable<TData>[keyof TData];
		}
	}
	return data;
}

export function titleize(camelCaseStr: string) {
	const spacedAtCapitals = camelCaseStr.replace(/([A-Z])/g, ' $1');
	return spacedAtCapitals.charAt(0).toUpperCase() + spacedAtCapitals.slice(1);
}
