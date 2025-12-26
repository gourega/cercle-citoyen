
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Lock, FileText, Mail, Phone, Globe, Scale } from 'lucide-react';
import Logo from '../Logo';

const LegalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cgu' | 'privacy' | 'mentions'>('cgu');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center text-gray-400 hover:text-gray-900 transition-colors font-bold text-sm group">
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Retour
          </Link>
          <Logo size={30} />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-16">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">Cadre de Confiance</h1>
          <p className="text-gray-500 font-medium italic">Règles, éthique et souveraineté des données.</p>
        </header>

        {/* Tabs */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-200 mb-12 shadow-sm overflow-x-auto no-scrollbar">
          {[
            { id: 'cgu', label: 'CGU', icon: <Scale size={14} /> },
            { id: 'privacy', label: 'Confidentialité', icon: <Lock size={14} /> },
            { id: 'mentions', label: 'Mentions Légales', icon: <FileText size={14} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[3rem] p-8 md:p-16 border border-gray-100 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'cgu' && (
            <article className="prose prose-blue max-w-none text-gray-700">
              <h2 className="font-serif text-3xl font-bold text-gray-900 mb-8">Conditions Générales d'Utilisation</h2>
              <p className="font-bold">Bienvenue sur le Cercle Citoyen.</p>
              <p>En accédant à cette plateforme, vous vous engagez à respecter les principes de dialogue mature et de respect mutuel définis dans notre Manifeste.</p>
              
              <h4 className="text-gray-900 font-bold mt-8 mb-4">1. Comportement Citoyen</h4>
              <p>Tout utilisateur s'engage à ne pas diffuser de contenus haineux, discriminatoires ou incitant à la violence. L'intelligence artificielle "L'Esprit du Gardien" assure une médiation automatique. En cas de non-respect répété, l'accès au Cercle pourra être suspendu.</p>
              
              <h4 className="text-gray-900 font-bold mt-8 mb-4">2. Propriété des Idées</h4>
              <p>Les idées partagées dans la "Banque des Idées" restent la propriété intellectuelle de leurs auteurs, mais leur partage sur le Cercle implique une volonté de collaboration pour le bien commun.</p>
              
              <h4 className="text-gray-900 font-bold mt-8 mb-4">3. Vérification des Faits</h4>
              <p>Le Cercle lutte activement contre la désinformation. Les publications identifiées comme fausses par nos outils de Fact-Check seront signalées ou supprimées.</p>
            </article>
          )}

          {activeTab === 'privacy' && (
            <article className="prose prose-blue max-w-none text-gray-700">
              <h2 className="font-serif text-3xl font-bold text-gray-900 mb-8">Politique de Confidentialité</h2>
              <p className="font-bold">Votre vie privée est le socle de votre liberté.</p>
              
              <h4 className="text-gray-900 font-bold mt-8 mb-4">1. Collecte des Données</h4>
              <p>Nous collectons uniquement les données nécessaires à votre identification citoyenne (nom, email, pseudonyme) et à la mesure de votre impact (scores, badges). Nous ne collectons aucune donnée de navigation à des fins publicitaires.</p>
              
              <h4 className="text-gray-900 font-bold mt-8 mb-4">2. Non-Revente des Données</h4>
              <p className="p-6 bg-blue-50 rounded-2xl border border-blue-100 font-bold text-blue-900 italic">
                Engagement Souverain : Le Cercle Citoyen s'interdit formellement de vendre, louer ou céder vos données personnelles à des tiers, qu'ils soient commerciaux ou politiques.
              </p>
              
              <h4 className="text-gray-900 font-bold mt-8 mb-4">3. Sécurité</h4>
              <p>Vos données sont sécurisées via l'infrastructure Supabase avec un chiffrement de bout en bout pour vos accès.</p>
            </article>
          )}

          {activeTab === 'mentions' && (
            <article className="prose prose-blue max-w-none text-gray-700">
              <h2 className="font-serif text-3xl font-bold text-gray-900 mb-8">Mentions Légales</h2>
              
              <div className="space-y-8">
                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Éditeur de la Plateforme</h4>
                  <p className="text-lg font-bold text-gray-900">CERCLE CITOYEN CI</p>
                  <p className="text-sm">Initiative Citoyenne Indépendante</p>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                    <Mail className="w-5 h-5 text-blue-600 mb-3" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Contact Email</h4>
                    <p className="font-bold text-gray-900">cerclecitoyenci@gmail.com</p>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                    <Phone className="w-5 h-5 text-emerald-600 mb-3" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Assistance Téléphonique</h4>
                    <p className="font-bold text-gray-900">+225 2522001239</p>
                  </div>
                </section>

                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Hébergement</h4>
                  <p className="font-bold text-gray-900">Infrastructure Cloud Cloudflare / Supabase</p>
                  <p className="text-sm">Services d'IA fournis par Google Gemini API (Souveraineté Technologique).</p>
                </section>

                <section className="pt-8 border-t border-gray-100">
                  <p className="text-xs text-gray-400 italic">
                    Cette plateforme a été conçue pour promouvoir le civisme et le développement durable en Côte d'Ivoire. Tous droits réservés © 2024.
                  </p>
                </section>
              </div>
            </article>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
