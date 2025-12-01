const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-semibold mb-4">ChemDiscovery AI</h3>
            <p className="text-sm">
              AI-powered platform for discovering novel chemical compounds in
              seconds.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#features"
                  className="hover:text-primary-400 transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-primary-400 transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#team"
                  className="hover:text-primary-400 transition-colors"
                >
                  Team
                </a>
              </li>
            </ul>
          </div>

          {/* Team */}
          <div>
            <h3 className="text-white font-semibold mb-4">Team</h3>
            <p className="text-sm">Cleo, Afif, Eska, Agung, Faris</p>
            <p className="text-xs mt-2 text-gray-400">
              Capstone Project - Dicoding 2025
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm">
          <p>&copy; 2025 ChemDiscovery AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
