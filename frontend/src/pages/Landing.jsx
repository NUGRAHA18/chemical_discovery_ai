import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import molecularBackground from "../assets/molecular-background.jpg";
import { motion, useScroll, useTransform } from "framer-motion";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 1000], [0, 200]);

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-cyan-500 selection:text-white flex flex-col overflow-x-hidden">
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Parallax Background */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${molecularBackground})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            y: yBg,
          }}
        >
          {/* Dark Overlay with subtle gradient */}
          <div className="absolute inset-0 bg-slate-950/80 bg-gradient-to-b from-slate-950/50 via-slate-950/80 to-slate-950 z-10"></div>
        </motion.div>

        {/* Ambient Floating Orbs (Web3 Glows) */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-600/30 rounded-full blur-[120px] z-10 pointer-events-none mix-blend-screen"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
          className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[120px] z-10 pointer-events-none mix-blend-screen"
        />

        {/* Hero Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Pill Badge */}
            <motion.div variants={fadeInUp} className="inline-block mb-6">
              <div className="px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <span className="text-cyan-400 text-sm font-bold tracking-widest uppercase font-mono">
                  The Future of Chemistry
                </span>
              </div>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 drop-shadow-2xl"
            >
              Discover Novel Chemicals <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-primary-500 to-purple-500 animate-gradient-x">
                Powered by AI Agents
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed border-l-2 border-cyan-500/50 pl-6 text-left md:text-center md:border-none md:pl-0"
            >
              Accelerate your research with our multi-agent AI system. From
              initial concept to validated molecular structures in seconds.
            </motion.p>

            {/* Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-5 justify-center items-center"
            >
              <Link
                to={isAuthenticated ? "/discover" : "/register"}
                className="relative group px-8 py-4 bg-transparent overflow-hidden rounded-xl"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary-600 to-cyan-600 opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-white/20 blur-lg group-hover:blur-xl transition-all duration-300 opacity-0 group-hover:opacity-50"></div>
                <span className="relative z-10 font-bold text-white tracking-wide">
                  Get Started Free
                </span>
              </Link>

              <Link
                to="/login"
                className="px-8 py-4 rounded-xl font-semibold text-white border border-slate-700 hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:bg-slate-800/80 backdrop-blur-sm transition-all duration-300"
              >
                Sign In
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats Section in Hero */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-3 gap-8 border-t border-slate-800/60 bg-slate-900/30 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto border border-slate-800"
          >
            {[
              { val: "100M+", label: "Compounds" },
              { val: "30-50s", label: "Generation Time" },
              { val: "99.9%", label: "Accuracy" },
            ].map((stat, idx) => (
              <div key={idx} className="text-center group cursor-default">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors duration-300 font-mono">
                  {stat.val}
                </div>
                <div className="text-slate-500 text-sm uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="py-32 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Why{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-primary-500">
                ChemDiscovery?
              </span>
            </h2>
            <p className="text-slate-400 text-lg">
              Advanced computational chemistry meets state-of-the-art machine
              learning in a decentralized era.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🤖",
                title: "Multi-Agent AI",
                description:
                  "Six specialized agents working in harmony to hypothesize, critique, and refine molecular structures.",
                gradient: "from-blue-500/20 to-cyan-500/20",
                border: "group-hover:border-cyan-500/50",
              },
              {
                icon: "⚗️",
                title: "RDKit Integration",
                description:
                  "Built-in validation ensuring all generated compounds obey laws of chemistry and physical feasibility.",
                gradient: "from-purple-500/20 to-pink-500/20",
                border: "group-hover:border-purple-500/50",
              },
              {
                icon: "📊",
                title: "Deep Analysis",
                description:
                  "Instant access to solubility prediction, molecular weight, and toxicity screening scores.",
                gradient: "from-emerald-500/20 to-green-500/20",
                border: "group-hover:border-emerald-500/50",
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                whileHover={{ y: -10 }}
                className={`group p-8 rounded-3xl bg-slate-900/50 border border-slate-800 ${feature.border} backdrop-blur-sm relative overflow-hidden transition-all duration-300`}
              >
                {/* Hover Gradient Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                ></div>

                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-4xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 font-mono">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section
        id="how-it-works"
        className="py-32 bg-slate-950 relative overflow-hidden"
      >
        {/* Grid Background Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center text-white mb-20"
          >
            Workflow <span className="text-cyan-400">Process</span>
          </motion.h2>

          <div className="relative">
            {/* Glowing Connector Line */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-slate-800">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="h-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_10px_#06b6d4]"
              />
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { title: "Input Criteria", desc: "Natural language prompts" },
                {
                  title: "AI Generation",
                  desc: "Agents synthesize candidates",
                },
                { title: "Validation", desc: "Computational checking" },
                { title: "Results", desc: "Export & Analyze" },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.3 }}
                  className="relative text-center group"
                >
                  <div className="w-24 h-24 mx-auto bg-slate-900 rounded-full border-4 border-slate-800 group-hover:border-cyan-500 transition-colors duration-300 flex items-center justify-center text-2xl font-bold text-slate-500 group-hover:text-cyan-400 shadow-xl mb-6 relative z-10">
                    <span className="font-mono">{idx + 1}</span>
                    {/* Ripple Effect */}
                    <div className="absolute inset-0 rounded-full border border-cyan-500/0 group-hover:animate-ping opacity-20"></div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 font-mono">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- TEAM SECTION --- */}
      <section id="team" className="py-32 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-white mb-16">
            Meet The <span className="text-purple-400">Minds</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-8">
            {[
              {
                name: "Cleo",
                role: "Machine Learning",
                uni: "Universitas Negeri Surabaya",
              },
              {
                name: "Afif",
                role: "Machine Learning",
                uni: "Universitas Negeri Surabaya",
              },
              { name: "Eska", role: "Backend", uni: "Institut Teknologi Del" },
              {
                name: "Agung",
                role: "Full Stack",
                uni: "UIN Sunan Kalijaga",
              },
              {
                name: "Faris",
                role: "Frontend",
                uni: "UIN Sunan Kalijagar",
              },
            ].map((member, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -10, scale: 1.02 }}
                className="w-48 text-center p-6 bg-gradient-to-b from-slate-800/40 to-slate-900/40 rounded-2xl border border-slate-700/50 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all duration-300 group backdrop-blur-sm"
              >
                <div className="w-24 h-24 mx-auto mb-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300"></div>
                  <div className="relative w-full h-full bg-slate-800 rounded-full flex items-center justify-center text-3xl font-bold text-slate-400 group-hover:text-white border-2 border-slate-700 group-hover:border-purple-400 transition-all">
                    {member.name[0]}
                  </div>
                </div>

                <h3 className="font-bold text-white mb-1 font-mono tracking-wide">
                  {member.name}
                </h3>

                <p className="text-xs font-medium text-purple-400 uppercase tracking-wider mb-1">
                  {member.role}
                </p>

                <p className="text-[10px] text-slate-500 font-light">
                  {member.uni}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/20 via-slate-950 to-purple-900/20 animate-pulse"></div>
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-950 to-transparent z-10"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
            Ready to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              Accelerate Discovery?
            </span>
          </h2>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Join the decentralized science movement. Use AI agents to unlock the
            next generation of materials.
          </p>
          <Link
            to={isAuthenticated ? "/discover" : "/register"}
            className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-white bg-gradient-to-r from-primary-600 to-cyan-600 rounded-xl hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] transition-all transform hover:scale-105"
          >
            Start Generating Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
