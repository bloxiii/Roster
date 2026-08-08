import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Mentions légales — Velin",
  robots: { index: true },
};

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="flex-1 relative z-10">
        <Container className="max-w-3xl py-20">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-paper">
            Mentions légales
          </h1>

          <div className="mt-12 space-y-10 text-sm leading-relaxed text-paper-dim">
            <section>
              <h2 className="font-display text-lg font-medium text-paper">
                Éditeur du site
              </h2>
              <div className="mt-4 space-y-1">
                <p>Velin</p>
                <p>Société en cours d&apos;immatriculation</p>
                <p>Email : contact@velin.ai</p>
                <p>Directeur de la publication : Enzo Duval</p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-lg font-medium text-paper">
                Hébergement
              </h2>
              <div className="mt-4 space-y-1">
                <p>Vercel Inc.</p>
                <p>440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis</p>
                <p>Site : vercel.com</p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-lg font-medium text-paper">
                Propriété intellectuelle
              </h2>
              <p className="mt-4">
                L&apos;ensemble du contenu de ce site (textes, images, graphismes, logo,
                icônes, logiciels, code source) est la propriété exclusive de Velin,
                sauf mention contraire. Toute reproduction, représentation, modification,
                publication ou adaptation de tout ou partie des éléments du site est
                interdite sans autorisation écrite préalable.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-medium text-paper">
                Limitation de responsabilité
              </h2>
              <p className="mt-4">
                Velin ne saurait être tenu responsable des dommages directs ou indirects
                causés au matériel de l&apos;utilisateur lors de l&apos;accès au site. Velin ne
                saurait également être tenu responsable des dommages indirects consécutifs
                à l&apos;utilisation du site. Velin se réserve le droit de modifier, corriger
                ou supprimer le contenu du site à tout moment sans préavis.
              </p>
            </section>
          </div>

          {/* Politique de confidentialité */}
          <h1 className="mt-24 font-display text-3xl font-semibold tracking-tight text-paper">
            Politique de confidentialité
          </h1>
          <p className="mt-4 text-sm text-paper-dim">
            Dernière mise à jour : août 2026
          </p>

          <div className="mt-12 space-y-10 text-sm leading-relaxed text-paper-dim">
            <section>
              <h2 className="font-display text-lg font-medium text-paper">
                1. Responsable du traitement
              </h2>
              <p className="mt-4">
                Le responsable du traitement des données personnelles collectées sur ce
                site est Velin, représenté par Enzo Duval. Pour toute question relative
                à vos données personnelles, vous pouvez nous contacter à : contact@velin.ai
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-medium text-paper">
                2. Données collectées
              </h2>
              <div className="mt-4 space-y-3">
                <p>
                  <span className="text-paper">Via le formulaire de contact :</span>{" "}
                  nom, email professionnel, nom de l&apos;entreprise, message.
                </p>
                <p>
                  <span className="text-paper">Via l&apos;agent IA (widget) :</span>{" "}
                  les informations communiquées lors de la conversation (projet immobilier,
                  budget, localisation, coordonnées). Ces données sont collectées pour le
                  compte de nos clients (agences immobilières) qui sont co-responsables du
                  traitement.
                </p>
                <p>
                  <span className="text-paper">Via la création de compte :</span>{" "}
                  nom, email, nom de l&apos;entreprise, mot de passe (chiffré).
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-lg font-medium text-paper">
                3. Finalités du traitement
              </h2>
              <div className="mt-4 space-y-2">
                <p>Les données sont collectées pour les finalités suivantes :</p>
                <p>— Répondre aux demandes de contact</p>
                <p>— Qualifier les prospects pour le compte de nos clients</p>
                <p>— Fournir le service de dashboard commercial</p>
                <p>— Envoyer des notifications relatives aux prospects qualifiés</p>
                <p>— Améliorer notre service</p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-lg font-medium text-paper">
                4. Base légale
              </h2>
              <p className="mt-4">
                Le traitement des données est fondé sur l&apos;intérêt légitime de Velin et
                de ses clients (qualification commerciale), ainsi que sur le consentement
                de l&apos;utilisateur lorsqu&apos;il engage une conversation avec l&apos;agent IA ou
                soumet le formulaire de contact.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-medium text-paper">
                5. Durée de conservation
              </h2>
              <p className="mt-4">
                Les données des prospects sont conservées pendant 24 mois à compter de
                leur collecte. Les données des comptes utilisateurs sont conservées
                pendant toute la durée de la relation contractuelle, puis 36 mois après
                sa fin. Vous pouvez demander la suppression de vos données à tout moment.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-medium text-paper">
                6. Sous-traitants
              </h2>
              <div className="mt-4 space-y-2">
                <p>Vos données peuvent être traitées par les sous-traitants suivants :</p>
                <p>— <span className="text-paper">Vercel Inc.</span> — hébergement du site et de l&apos;application</p>
                <p>— <span className="text-paper">Supabase Inc.</span> — base de données et authentification</p>
                <p>— <span className="text-paper">Anthropic PBC</span> — traitement du langage naturel (agent IA)</p>
                <p>— <span className="text-paper">Resend Inc.</span> — envoi d&apos;emails transactionnels</p>
                <p>
                  Ces sous-traitants sont situés aux États-Unis et bénéficient de
                  garanties conformes au RGPD (clauses contractuelles types).
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-lg font-medium text-paper">
                7. Vos droits
              </h2>
              <div className="mt-4 space-y-2">
                <p>
                  Conformément au Règlement Général sur la Protection des Données (RGPD)
                  et à la loi Informatique et Libertés, vous disposez des droits suivants :
                </p>
                <p>— Droit d&apos;accès à vos données personnelles</p>
                <p>— Droit de rectification</p>
                <p>— Droit d&apos;effacement (droit à l&apos;oubli)</p>
                <p>— Droit à la limitation du traitement</p>
                <p>— Droit à la portabilité de vos données</p>
                <p>— Droit d&apos;opposition</p>
                <p className="mt-3">
                  Pour exercer ces droits, contactez-nous à : contact@velin.ai
                </p>
                <p>
                  Si vous estimez que le traitement de vos données constitue une violation
                  de vos droits, vous pouvez introduire une réclamation auprès de la CNIL
                  (Commission Nationale de l&apos;Informatique et des Libertés) : www.cnil.fr
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-lg font-medium text-paper">
                8. Cookies
              </h2>
              <p className="mt-4">
                Ce site utilise uniquement des cookies techniques nécessaires au
                fonctionnement du service (authentification, préférence de langue).
                Aucun cookie publicitaire ou de tracking n&apos;est utilisé.
              </p>
            </section>
          </div>
        </Container>
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </>
  );
}
