function Footer({copyright}) {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-800 text-white py-6 mt-auto">
            <div className="container mx-auto px-4">
                <div
                    className="flex flex-col md:flex-row justify-between items-center">
                    {/* Copyright */}
                    <div className="text-sm text-gray-300 mb-4 md:mb-0">
                        {copyright || `© ${currentYear} React Application. All rights reserved.`}
                    </div>

                    {/* Links */}
                    <div className="flex space-x-6 text-sm">
                        <a
                            href="/privacy"
                            className="text-gray-300 hover:text-white transition-colors"
                        >
                            Privacy Policy
                        </a>
                        <a
                            href="/terms"
                            className="text-gray-300 hover:text-white transition-colors"
                        >
                            Terms of Service
                        </a>
                        <a
                            href="/contact"
                            className="text-gray-300 hover:text-white transition-colors"
                        >
                            Contact
                        </a>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-4 pt-4 border-t border-gray-700 text-center">
                    <p className="text-xs text-gray-400">React Starter
                        Template</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
