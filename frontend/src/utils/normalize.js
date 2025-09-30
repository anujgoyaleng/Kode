export function normalizeUppercase(value) {
    if (typeof value !== 'string') return '';
    return value.trim().toUpperCase();
}

export function normalizeDepartment(value) {
    return normalizeUppercase(value);
}

export function normalizeSection(value) {
    return normalizeUppercase(value);
}

export function normalizeBatch(value) {
    if (value == null) return '';
    const str = String(value).trim();
    // Extract 4-digit year if present
    const match = str.match(/\b(19\d{2}|20\d{2})\b/);
    return match ? match[1] : str;
}

export function normalizeSemester(value) {
    const n = parseInt(String(value).trim(), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
}

