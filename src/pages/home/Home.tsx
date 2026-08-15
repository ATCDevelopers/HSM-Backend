import {SparklesIcon, BookOpenIcon, CogIcon} from "@heroicons/react/24/outline";
import BaseLayout from "../../components/layouts/BaseLayout";

function Home() {
    return (
        <BaseLayout resourceName="Home">
            <div className="space-y-8">
                {/* Welcome banner */}
                <div
                    className="mx-auto max-w-2xl rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10 text-center text-white shadow-sm">
                    <h1 className="text-2xl font-bold">Welcome to Your React
                        Application</h1>
                    <p className="mt-2 text-blue-100">A clean, modern starter
                        template for building React applications</p>
                </div>

                {/* Getting started guide */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                            <SparklesIcon className="h-6 w-6"/>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">Quick
                            Start</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            This template includes authentication, routing, and
                            a complete UI component library to get you started
                            quickly.
                        </p>
                    </div>

                    <div
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
                            <BookOpenIcon className="h-6 w-6"/>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">Documentation</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Check the README.md file for detailed setup
                            instructions, configuration options, and usage
                            examples.
                        </p>
                    </div>

                    <div
                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                            <CogIcon className="h-6 w-6"/>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">Configuration</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Customize your application by editing the
                            configuration in src/config/projectConfig.js.
                        </p>
                    </div>
                </div>

                {/* Next steps */}
                <div
                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900">Next
                        Steps</h3>
                    <ul className="mt-4 space-y-3 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                            <span
                                className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600"/>
                            <span>Configure your API settings in <code
                                className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">src/config/projectConfig.js</code></span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span
                                className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600"/>
                            <span>Add your API endpoints using the <code
                                className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">createResourceAPI</code> factory function</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span
                                className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600"/>
                            <span>Create your pages and add routes in <code
                                className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">src/routes/AppRoutes.jsx</code></span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span
                                className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600"/>
                            <span>Use the generic CRUD components in <code
                                className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">src/pages/crud/</code> for standard operations</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span
                                className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600"/>
                            <span>Build your UI using the components in <code
                                className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">src/components/</code></span>
                        </li>
                    </ul>
                </div>
            </div>
        </BaseLayout>
    );
}

export default Home;
