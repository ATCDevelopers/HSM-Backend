/**
 * Helpers for reading Laravel API responses.
 *
 * List endpoints return a resource collection shaped like:
 *   { <resourceKey>: [...], links: {...}, meta: { current_page, last_page, per_page, total } }
 * where <resourceKey> is the resource name (e.g. "users", "unit_statuses").
 * Some endpoints may instead return a bare array or a { data: [...] } wrapper.
 */

/**
 * Extracts the array payload from a list response, regardless of the wrapper key.
 *
 * @param {Object} response - Axios response object.
 * @returns {Array} The list of records (empty array if none found).
 */
export function extractList(response) {
    let raw = response?.data;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object") {
        if (Array.isArray(raw.data)) return raw.data;
        // Unwrap the outer { data: {...} } envelope Laravel adds around collections.
        if (raw.data && typeof raw.data === "object") raw = raw.data;
        const key = Object.keys(raw).find(
            (k) => k !== "links" && k !== "meta" && Array.isArray(raw[k]),
        );
        if (key) return raw[key];
    }
    return [];
}

/**
 * Extracts pagination info from a list response.
 *
 * @param {Object} response - Axios response object.
 * @param {number} [fallbackCount=0] - Item count to use when no meta is present.
 * @returns {{ totalPages: number, totalItems: number }}
 */
export function extractMeta(response, fallbackCount = 0) {
    let raw = response?.data;
    if (raw && typeof raw === "object" && raw.data && typeof raw.data === "object" && !Array.isArray(raw.data)) {
        raw = raw.data;
    }
    const meta = raw?.meta;
    if (meta) {
        return {
            totalPages: meta.last_page || meta.lastPage || 1,
            totalItems: meta.total ?? fallbackCount,
        };
    }
    return {totalPages: 1, totalItems: fallbackCount};
}

/**
 * Extracts a single record from a show/detail response
 * (handles { data: {...} }, a bare object, or a single-element array).
 *
 * @param {Object} response - Axios response object.
 * @returns {Object|null}
 */
export function extractRecord(response) {
    const raw = response?.data;
    if (Array.isArray(raw)) return raw[0] ?? null;
    if (raw && typeof raw === "object") return raw.data ?? raw;
    return raw ?? null;
}
