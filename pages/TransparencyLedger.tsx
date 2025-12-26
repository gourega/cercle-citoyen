
import React from 'react';
import { 
  BookText, 
  Smartphone, 
  Server, 
  Heart, 
  ArrowUpRight, 
  TrendingDown, 
  CheckCircle, 
  Info,
  ShieldCheck,
  TrendingUp,
  History
} from 'lucide-react';

const TransparencyLedger: React.FC = () => {
  const allocations = [
    { label: "Infrastructure IA et Serveurs", amount: 150000, percentage: 35, icon: Server, color: "bg-blue-600" },
    { label: "Soutien aux Projets Locaux", amount: 180000, percentage: 42, icon: Heart, color: "bg-rose-600" },
    { label: "Fonds de Résilience Sociale", amount: 50000, percentage: 12, icon: ShieldCheck, color: "bg-emerald-600" },
    { label: "Maintenance Plateforme", amount: 40000, percentage: 11, icon: Smartphone, color: "bg-amber-600" },
  ];

  const recentTransactions = [
    { label: "Allocation : Nettoyage Lagune", amount: -25000, date: "Hier", status: "Confirmé" },
    { label: "Validation : Don Amadou K.", amount: 5000, date: "Hier", status: "Confirmé" },
    { label: "Paiement API Gemini", amount: -12000, date: "Il y a 2j", status: "Confirmé" },
    { label: "Don : Citoyen Anonyme", amount: 10000, date: "Il y a 3j", status: "Confirmé" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 lg:py-20 animate-in fade-in duration-700">
      <div className="text-center mb-16">
        <div className="inline-flex w-16 h-16 bg-amber-50 rounded-[1.5rem] items-center justify-center mb-6 border border-amber-100">
          <BookText className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">Registre de Transparence</h1>
        <p className="text-gray-500 max-w-2xl mx-auto italic">
          "La confiance ne se donne pas, elle se construit par la preuve." 
          Chaque franc versé par la cité est ici tracé pour le bien commun.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Main Balance Card */}
          <div className="bg-gray-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform"><BookText className="w-40 h-40" /></div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-400 mb-4">Trésorerie Actuelle</p>
              <h2 className="text-5xl md:text-6xl font-serif font-bold mb-8">420,000 <span className="text-2xl font-sans text-gray-400">FCFA</span></h2>
              <div className="flex flex-wrap gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-gray-500">Flux Entrants</p>
                    <p className="font-bold text-sm">+85,000 / mois</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-gray-500">Flux Sortants</p>
                    <p className="font-bold text-sm">-32,000 / mois</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Allocation Details */}
          <div className="space-y-6">
            <h3 className="font-serif font-bold text-2xl text-gray-900 px-4">Répartition des Ressources</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {allocations.map((item, i) => (
                <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 ${item.color} text-white rounded-2xl flex items-center justify-center`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <span className="text-xl font-serif font-bold text-gray-900">{item.percentage}%</span>
                  </div>
                  <h4 className="font-bold text-gray-800 mb-1">{item.label}</h4>
                  <p className="text-xs text-gray-400 font-medium mb-4">{item.amount.toLocaleString()} FCFA alloués</p>
                  <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-8">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest">Journal des Flux</h3>
              <History className="w-4 h-4 text-gray-300" />
            </div>
            <div className="space-y-6">
              {recentTransactions.map((tx, i) => (
                <div key={i} className="flex justify-between items-start gap-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 mb-1">{tx.label}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{tx.date} • {tx.status}</p>
                  </div>
                  <span className={`text-sm font-black ${tx.amount > 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-4 bg-gray-50 hover:bg-gray-100 text-[11px] font-black uppercase tracking-widest text-gray-400 rounded-2xl transition-all">
              Voir tout l'historique
            </button>
          </div>

          <div className="bg-blue-600 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px'}}></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold mb-4">Devenez Bienfaiteur</h3>
              <p className="text-sm text-blue-100 leading-relaxed mb-8">
                Votre contribution directe finance l'intelligence de la cité. Pas de publicité, pas de revente de données. Juste nous.
              </p>
              <button className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg shadow-blue-900/20">
                Soutenir la cité
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TransparencyLedger;
