/**
 * Guest layout — wrapper for unauthenticated pages (login, register).
 *
 * Centers a single card on a neutral background. Keeps auth screens visually
 * separate from the authenticated app shell (BaseLayout with header/sidebar).
 *
 * @param {React.ReactNode} props.children - The form/card content.
 * @param {string} [props.title] - Heading shown above the card content.
 * @param {string} [props.subtitle] - Supporting text under the heading.
 */
function Guest({children, title = "", subtitle = ""}) {
    return (
        <div
            className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {title && (
                    <h1 className="text-center text-2xl font-bold text-gray-900">{title}</h1>
                )}
                {subtitle &&
                    <p className="mt-2 text-center text-sm text-gray-600">{subtitle}</p>}
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div
                    className="bg-white py-8 px-4 shadow rounded-lg sm:px-10">{children}</div>
            </div>
        </div>
    );
}

export default Guest;
