const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 py-12 mt-auto font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* About */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-cyan-400">
              ChemDiscovery AI
            </h3>
            <p className="text-sm leading-relaxed text-slate-400 max-w-xs">
              AI-powered platform for discovering novel chemical compounds in
              seconds. Accelerating research through machine intelligence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">
              Quick Links
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="#features"
                  className="block hover:text-primary-400 hover:translate-x-1 transition-all duration-200"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="block hover:text-primary-400 hover:translate-x-1 transition-all duration-200"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#team"
                  className="block hover:text-primary-400 hover:translate-x-1 transition-all duration-200"
                >
                  Team
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/NUGRAHA18/chemical_discovery_ai"
                  className="block hover:text-primary-400 hover:translate-x-1 transition-all duration-200"
                >
                  Github repository
                </a>
              </li>
            </ul>
          </div>

          {/* Team */}
          <div>
            <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">
              Our Team
            </h3>
            <div className="text-sm text-slate-400 leading-relaxed mb-4">
              <span className="hover:text-white transition-colors">Cleo</span>,{" "}
              <span className="hover:text-white transition-colors">Afif</span>,{" "}
              <span className="hover:text-white transition-colors">Eska</span>,{" "}
              <span className="hover:text-white transition-colors">Agung</span>,{" "}
              <span className="hover:text-white transition-colors">Faris</span>
            </div>

            <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-primary-500 mr-2 animate-pulse"></span>
              <p className="text-xs text-slate-500 font-medium">
                Capstone Project - Asah led by Dicoding 2025
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-900 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-600">
          <p>&copy; 2025 ChemDiscovery AI. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            {/* Placeholder for legal links if needed later, styling preserved */}
            <span className="hover:text-slate-400 cursor-pointer transition-colors">
              Privacy Policy
            </span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">
              Terms of Service
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
