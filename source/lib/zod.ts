import { z, ZodIssueCode } from 'zod';

interface FriendlyError {
	field: string;
	code: string;
	message: string;
	expected?: string | number | boolean | null | undefined;
	received?: string | number | boolean | null | undefined;
}

/**
 * Valida `data` contra `schema` y, si falla,
 * devuelve un array de FriendlyError con código y ruta.
 */
export function customParse<T>(
	schema: z.ZodType<T>,
	data: unknown
): { success: true; data: T } | { success: false; errors: FriendlyError[]; message: string } {
	const result = schema.safeParse(data);

	if (result.success) {
		return { success: true, data: result.data };
	}

	const errors: FriendlyError[] = result.error.issues.map((issue) => ({
		field: issue.path.length > 0 ? issue.path.join('.') : 'root',
		code: issue.code,
		expected: (issue as any).expected || undefined,
		received: (issue as any).received || undefined,
		message: issue.message.toLowerCase(),
	}));

	return { success: false, errors, message: buildErrorMessage(errors) };
}

function buildErrorMessage(errors: FriendlyError[]): string {
	console.log('---', errors, '---');

	const missingOrNullErroredFields = {
		errors: [] as FriendlyError[],
		prefix: 'Field',
		sufix: 'are missing or null',
	};

	// Utilizar forEach en lugar de map ya que solo necesitamos el efecto secundario
	errors.forEach((error) => {
		if (
			error.code === ZodIssueCode.invalid_type &&
			error.expected &&
			(error.received === 'undefined' || error.received === 'null')
		) {
			missingOrNullErroredFields.errors.push(error);
		}
	});

	const filteredErrors = [missingOrNullErroredFields];

	// Construcción del mensaje de manera más clara
	const message = filteredErrors
		.map((errorCategory) => {
			if (errorCategory.errors.length === 0) return '';

			const pluralSuffix = errorCategory.errors.length > 1 ? 's' : '';
			const fieldList = errorCategory.errors.map((error) => ` ${error.field}`).join(',');

			return `${errorCategory.prefix}${pluralSuffix}${fieldList} ${errorCategory.sufix}`;
		})
		.filter(Boolean)
		.join(' ');

	return message;
}
