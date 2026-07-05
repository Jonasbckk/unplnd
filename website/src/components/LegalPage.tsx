import type { ReactNode } from 'react';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import { CONTACT_EMAIL } from '../config';

/*
 * Legal texts based on the operator's existing Impressum/Datenschutz
 * (Einzelunternehmen Jonas Becker), adapted for unplnd.com:
 * site reference + contact mail, RStV→MStV / TMG→DDG updates, hosting kept
 * provider-neutral (TODO below), analytics/FontAwesome sections removed
 * (not used here), early-access form + Supabase added.
 */

export type LegalKind = 'impressum' | 'datenschutz' | 'teilnahmebedingungen';

export function LegalPage({ kind }: { kind: LegalKind }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6 md:pt-32">
      <a
        href="#top"
        className="inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-terra-ink transition-colors hover:text-heading"
      >
        <ArrowLeftIcon size={16} weight="bold" aria-hidden />
        Zurück zur Startseite
      </a>

      {kind === 'impressum' ? (
        <Impressum />
      ) : kind === 'datenschutz' ? (
        <Datenschutz />
      ) : (
        <Teilnahmebedingungen />
      )}
    </div>
  );
}

function Teilnahmebedingungen() {
  return (
    <>
      <H1>Teilnahmebedingungen: Early-Access-Verlosung</H1>

      <H3>1. Veranstalter</H3>
      <P>
        Veranstalter der Verlosung ist Jonas Becker (Sides4you – Jonas Becker – Digital
        Services), Grüningerweg 17A, 35415 Pohlheim, Deutschland (nachfolgend „Veranstalter").
      </P>

      <H3>2. Teilnahme</H3>
      <P>
        Die Teilnahme erfolgt automatisch und kostenlos durch die Eintragung in die
        Early-Access-Liste auf unplnd.com (Angabe von Name und E-Mail-Adresse). Pro Person
        ist eine Teilnahme möglich; maßgeblich ist die E-Mail-Adresse. Die Teilnahme ist
        nicht vom Erwerb einer Ware oder Dienstleistung abhängig.
      </P>

      <H3>3. Teilnahmeberechtigung</H3>
      <P>
        Teilnahmeberechtigt sind natürliche Personen ab 18 Jahren mit Wohnsitz in
        Deutschland. Eine Teilnahme über Gewinnspiel-Dienste, automatisierte Eintragungen
        oder mit falschen Angaben ist ausgeschlossen.
      </P>

      <H3>4. Verlosung und Gewinn</H3>
      <P>
        Sobald 500 Anmeldungen auf der Early-Access-Liste erreicht sind, verlost der
        Veranstalter unter allen bis zu diesem Zeitpunkt Angemeldeten fünf Gewinne zu je
        50&nbsp;Euro Guthaben. Das Guthaben ist ausschließlich in der UNPLND App einlösbar
        und wird den Gewinnern nach Veröffentlichung der App gutgeschrieben. Eine
        Barauszahlung, Übertragung auf Dritte oder Auszahlung in anderer Form ist
        ausgeschlossen.
      </P>

      <H3>5. Ermittlung und Benachrichtigung der Gewinner</H3>
      <P>
        Die Gewinner werden nach dem Zufallsprinzip gezogen und per E-Mail an die bei der
        Anmeldung angegebene Adresse benachrichtigt. Meldet sich ein Gewinner nicht
        innerhalb von 14 Tagen nach der Benachrichtigung, verfällt der Gewinnanspruch und
        es wird nachgelost.
      </P>

      <H3>6. Datenschutz</H3>
      <P>
        Die im Rahmen der Anmeldung erhobenen Daten (Name, E-Mail-Adresse) werden gemäß
        unserer Datenschutzerklärung verarbeitet und für die Durchführung der Verlosung
        verwendet. Weitere Informationen finden Sie in der{' '}
        <a
          href="#/datenschutz"
          className="font-medium text-terra-ink underline decoration-terra/40 underline-offset-2 hover:text-heading"
        >
          Datenschutzerklärung
        </a>
        .
      </P>

      <H3>7. Vorzeitige Beendigung und Änderungen</H3>
      <P>
        Der Veranstalter behält sich vor, die Verlosung aus wichtigem Grund (z.&nbsp;B.
        technische Probleme, Manipulation, wesentliche Änderung oder Einstellung des
        App-Vorhabens) anzupassen, zu unterbrechen oder zu beenden. Bereits entstandene
        Gewinnansprüche bleiben davon unberührt, soweit die Ziehung bereits erfolgt ist.
      </P>

      <H3>8. Sonstiges</H3>
      <P>
        Der Rechtsweg ist ausgeschlossen. Es gilt das Recht der Bundesrepublik Deutschland.
        Sollten einzelne Bestimmungen dieser Teilnahmebedingungen unwirksam sein, bleibt
        die Wirksamkeit der übrigen Bestimmungen unberührt.
      </P>

      <P>
        <span className="mt-8 block text-[13.5px] text-ink-2">Stand: Juli 2026</span>
      </P>
    </>
  );
}

function H1({ children }: { children: ReactNode }) {
  return (
    <h1 className="mt-6 text-3xl font-bold tracking-tight text-heading sm:text-4xl">{children}</h1>
  );
}
function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-12 text-2xl font-bold tracking-tight text-heading">{children}</h2>
  );
}
function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-8 text-lg font-semibold tracking-tight text-heading">{children}</h3>;
}
function P({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{children}</p>;
}
function Address({ lines }: { lines: string[] }) {
  return (
    <p className="mt-3 text-[15px] leading-relaxed text-ink">
      {lines.map((l) => (
        <span key={l} className="block">
          {l}
        </span>
      ))}
    </p>
  );
}

function Impressum() {
  return (
    <>
      <H1>Impressum</H1>

      <H2>Angaben gemäß § 5 DDG</H2>
      <P>Betreiber der Website unplnd.com:</P>
      <Address
        lines={[
          'Sides4you – Jonas Becker – Digital Services',
          'Jonas Becker',
          'Grüningerweg 17A',
          '35415 Pohlheim',
          'Deutschland',
        ]}
      />

      <H3>Kontakt</H3>
      <Address
        lines={[
          'Telefon (Privat): +49 1590 6161050',
          'Telefon (Geschäftlich): +49 15679 784318',
          `E-Mail: ${CONTACT_EMAIL}`,
        ]}
      />

      <H3>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</H3>
      <Address lines={['Jonas Becker', 'Grüningerweg 17A', '35415 Pohlheim', 'Deutschland']} />

      <H3>Unternehmensform</H3>
      <P>Einzelunternehmen</P>

      <H3>Hinweis gemäß § 19 UStG</H3>
      <P>
        Es wird keine Umsatzsteuer berechnet, da das Unternehmen die Kleinunternehmerregelung
        gemäß § 19 UStG in Anspruch nimmt.
      </P>

      <H2>Haftungsausschluss</H2>

      <H3>Haftung für Inhalte</H3>
      <P>
        Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
        Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
        Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten
        nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als
        Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
        Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
        rechtswidrige Tätigkeit hinweisen.
      </P>

      <H3>Haftung für Links</H3>
      <P>
        Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir
        keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr
        übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter
        oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt
        der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum
        Zeitpunkt der Verlinkung nicht erkennbar.
      </P>

      <H3>Urheberrecht</H3>
      <P>
        Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
        unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung
        und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der
        schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien
        dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
      </P>
    </>
  );
}

function Datenschutz() {
  return (
    <>
      <H1>Datenschutzerklärung</H1>

      <H2>1. Datenschutz auf einen Blick</H2>

      <H3>Allgemeine Hinweise</H3>
      <P>
        Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
        personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene
        Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
        Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem
        Text aufgeführten Datenschutzerklärung.
      </P>

      <H3>Datenerfassung auf dieser Website</H3>
      <P>
        <strong className="text-ink">
          Wer ist verantwortlich für die Datenerfassung auf dieser Website?
        </strong>
      </P>
      <P>
        Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen
        Kontaktdaten können Sie dem Abschnitt „Hinweis zur verantwortlichen Stelle" in dieser
        Datenschutzerklärung entnehmen.
      </P>
      <P>
        <strong className="text-ink">Wie erfassen wir Ihre Daten?</strong>
      </P>
      <P>
        Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei
        kann es sich z.&nbsp;B. um Daten handeln, die Sie in das Early-Access-Formular
        eingeben.
      </P>
      <P>
        Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website
        durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z.&nbsp;B.
        Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser
        Daten erfolgt automatisch, sobald Sie diese Website betreten.
      </P>
      <P>
        <strong className="text-ink">Wofür nutzen wir Ihre Daten?</strong>
      </P>
      <P>
        Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu
        gewährleisten. Daten, die Sie in das Early-Access-Formular eintragen, verwenden wir
        ausschließlich, um Sie über den Start der UNPLND App zu informieren.
      </P>
      <P>
        <strong className="text-ink">Welche Rechte haben Sie bezüglich Ihrer Daten?</strong>
      </P>
      <P>
        Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und
        Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein
        Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine
        Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung
        jederzeit für die Zukunft widerrufen. Außerdem haben Sie das Recht, unter bestimmten
        Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu
        verlangen. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen
        Aufsichtsbehörde zu.
      </P>
      <P>
        Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit an
        uns wenden.
      </P>

      <H3>Analyse-Tools und Tools von Drittanbietern</H3>
      <P>
        Beim Besuch dieser Website kann Ihr Surf-Verhalten statistisch ausgewertet werden.
        Das geschieht mit Vercel Web Analytics (siehe Abschnitt 5). Die Auswertung erfolgt
        ohne Cookies und ohne geräteübergreifende Identifikation.
      </P>

      <H2>2. Hosting</H2>
      <P>Wir hosten die Inhalte unserer Website bei folgendem Anbieter:</P>
      <H3>Vercel</H3>
      <P>
        Anbieter ist die Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA
        (nachfolgend „Vercel"). Wenn Sie unsere Website besuchen, werden Ihre
        personenbezogenen Daten auf den Servern von Vercel verarbeitet. Hierbei kann es sich
        v.&nbsp;a. um IP-Adressen, Meta- und Kommunikationsdaten, Websitezugriffe und
        sonstige Daten, die über eine Website generiert werden, handeln. Details entnehmen
        Sie der Datenschutzerklärung von Vercel:{' '}
        <a
          href="https://vercel.com/legal/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-terra-ink underline decoration-terra/40 underline-offset-2 hover:text-heading"
        >
          https://vercel.com/legal/privacy-policy
        </a>
      </P>
      <P>
        Das externe Hosting erfolgt im Interesse einer sicheren, schnellen und effizienten
        Bereitstellung unseres Online-Angebots durch einen professionellen Anbieter (Art. 6
        Abs. 1 lit. f DSGVO). Sofern eine entsprechende Einwilligung abgefragt wurde, erfolgt
        die Verarbeitung ausschließlich auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO und
        §&nbsp;25 Abs. 1 TDDDG, soweit die Einwilligung die Speicherung von Cookies oder den
        Zugriff auf Informationen im Endgerät des Nutzers (z.&nbsp;B. Device-Fingerprinting)
        im Sinne des TDDDG umfasst. Die Einwilligung ist jederzeit widerrufbar.
      </P>
      <P>
        Unser Hoster wird Ihre Daten nur insoweit verarbeiten, wie dies zur Erfüllung seiner
        Leistungspflichten erforderlich ist und unsere Weisungen in Bezug auf diese Daten
        befolgen.
      </P>

      <H2>3. Allgemeine Hinweise und Pflichtinformationen</H2>

      <H3>Datenschutz</H3>
      <P>
        Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst.
        Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den
        gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
      </P>
      <P>
        Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben.
        Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden
        können. Die vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und
        wofür wir sie nutzen. Sie erläutert auch, wie und zu welchem Zweck das geschieht.
      </P>
      <P>
        Wir weisen darauf hin, dass die Datenübertragung im Internet (z.&nbsp;B. bei der
        Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz
        der Daten vor dem Zugriff durch Dritte ist nicht möglich.
      </P>

      <H3>Hinweis zur verantwortlichen Stelle</H3>
      <P>Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</P>
      <Address lines={['Jonas Becker', 'Grüningerweg 17A', '35415 Pohlheim']} />
      <Address lines={['Telefon: +49 1590 6161050', `E-Mail: ${CONTACT_EMAIL}`]} />
      <P>
        Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder
        gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von
        personenbezogenen Daten (z.&nbsp;B. Namen, E-Mail-Adressen o.&nbsp;Ä.) entscheidet.
      </P>

      <H3>Speicherdauer</H3>
      <P>
        Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt
        wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die
        Datenverarbeitung entfällt. Wenn Sie ein berechtigtes Löschersuchen geltend machen
        oder eine Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten gelöscht,
        sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung Ihrer
        personenbezogenen Daten haben (z.&nbsp;B. steuer- oder handelsrechtliche
        Aufbewahrungsfristen); im letztgenannten Fall erfolgt die Löschung nach Fortfall
        dieser Gründe.
      </P>

      <H3>Allgemeine Hinweise zu den Rechtsgrundlagen der Datenverarbeitung auf dieser Website</H3>
      <P>
        Sofern Sie in die Datenverarbeitung eingewilligt haben, verarbeiten wir Ihre
        personenbezogenen Daten auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO bzw. Art. 9 Abs.
        2 lit. a DSGVO, sofern besondere Datenkategorien nach Art. 9 Abs. 1 DSGVO verarbeitet
        werden. Im Falle einer ausdrücklichen Einwilligung in die Übertragung
        personenbezogener Daten in Drittstaaten erfolgt die Datenverarbeitung außerdem auf
        Grundlage von Art. 49 Abs. 1 lit. a DSGVO. Sofern Sie in die Speicherung von Cookies
        oder in den Zugriff auf Informationen in Ihr Endgerät (z.&nbsp;B. via
        Device-Fingerprinting) eingewilligt haben, erfolgt die Datenverarbeitung zusätzlich
        auf Grundlage von § 25 Abs. 1 TDDDG. Die Einwilligung ist jederzeit widerrufbar. Sind
        Ihre Daten zur Vertragserfüllung oder zur Durchführung vorvertraglicher Maßnahmen
        erforderlich, verarbeiten wir Ihre Daten auf Grundlage des Art. 6 Abs. 1 lit. b
        DSGVO. Des Weiteren verarbeiten wir Ihre Daten, sofern diese zur Erfüllung einer
        rechtlichen Verpflichtung erforderlich sind, auf Grundlage von Art. 6 Abs. 1 lit. c
        DSGVO. Die Datenverarbeitung kann ferner auf Grundlage unseres berechtigten
        Interesses nach Art. 6 Abs. 1 lit. f DSGVO erfolgen. Über die jeweils im Einzelfall
        einschlägigen Rechtsgrundlagen wird in den folgenden Absätzen dieser
        Datenschutzerklärung informiert.
      </P>

      <H3>Empfänger von personenbezogenen Daten</H3>
      <P>
        Im Rahmen unserer Geschäftstätigkeit arbeiten wir mit verschiedenen externen Stellen
        zusammen. Dabei ist teilweise auch eine Übermittlung von personenbezogenen Daten an
        diese externen Stellen erforderlich. Wir geben personenbezogene Daten nur dann an
        externe Stellen weiter, wenn dies im Rahmen einer Vertragserfüllung erforderlich ist,
        wenn wir gesetzlich hierzu verpflichtet sind (z.&nbsp;B. Weitergabe von Daten an
        Steuerbehörden), wenn wir ein berechtigtes Interesse nach Art. 6 Abs. 1 lit. f DSGVO
        an der Weitergabe haben oder wenn eine sonstige Rechtsgrundlage die Datenweitergabe
        erlaubt. Beim Einsatz von Auftragsverarbeitern geben wir personenbezogene Daten
        unserer Kunden nur auf Grundlage eines gültigen Vertrags über Auftragsverarbeitung
        weiter.
      </P>

      <H3>Widerruf Ihrer Einwilligung zur Datenverarbeitung</H3>
      <P>
        Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung
        möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die
        Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf
        unberührt.
      </P>

      <H3>
        Widerspruchsrecht gegen die Datenerhebung in besonderen Fällen sowie gegen
        Direktwerbung (Art. 21 DSGVO)
      </H3>
      <P>
        Wenn die Datenverarbeitung auf Grundlage von Art. 6 Abs. 1 lit. e oder f DSGVO
        erfolgt, haben Sie jederzeit das Recht, aus Gründen, die sich aus Ihrer besonderen
        Situation ergeben, gegen die Verarbeitung Ihrer personenbezogenen Daten Widerspruch
        einzulegen; dies gilt auch für ein auf diese Bestimmungen gestütztes Profiling. Die
        jeweilige Rechtsgrundlage, auf denen eine Verarbeitung beruht, entnehmen Sie dieser
        Datenschutzerklärung. Wenn Sie Widerspruch einlegen, werden wir Ihre betroffenen
        personenbezogenen Daten nicht mehr verarbeiten, es sei denn, wir können zwingende
        schutzwürdige Gründe für die Verarbeitung nachweisen, die Ihre Interessen, Rechte und
        Freiheiten überwiegen oder die Verarbeitung dient der Geltendmachung, Ausübung oder
        Verteidigung von Rechtsansprüchen (Widerspruch nach Art. 21 Abs. 1 DSGVO).
      </P>
      <P>
        Werden Ihre personenbezogenen Daten verarbeitet, um Direktwerbung zu betreiben, so
        haben Sie das Recht, jederzeit Widerspruch gegen die Verarbeitung Sie betreffender
        personenbezogener Daten zum Zwecke derartiger Werbung einzulegen; dies gilt auch für
        das Profiling, soweit es mit solcher Direktwerbung in Verbindung steht. Wenn Sie
        widersprechen, werden Ihre personenbezogenen Daten anschließend nicht mehr zum Zwecke
        der Direktwerbung verwendet (Widerspruch nach Art. 21 Abs. 2 DSGVO).
      </P>

      <H3>Beschwerderecht bei der zuständigen Aufsichtsbehörde</H3>
      <P>
        Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei
        einer Aufsichtsbehörde, insbesondere in dem Mitgliedstaat ihres gewöhnlichen
        Aufenthalts, ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes zu. Das
        Beschwerderecht besteht unbeschadet anderweitiger verwaltungsrechtlicher oder
        gerichtlicher Rechtsbehelfe.
      </P>

      <H3>Recht auf Datenübertragbarkeit</H3>
      <P>
        Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in
        Erfüllung eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in
        einem gängigen, maschinenlesbaren Format aushändigen zu lassen. Sofern Sie die
        direkte Übertragung der Daten an einen anderen Verantwortlichen verlangen, erfolgt
        dies nur, soweit es technisch machbar ist.
      </P>

      <H3>Auskunft, Berichtigung und Löschung</H3>
      <P>
        Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf
        unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren
        Herkunft und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf
        Berichtigung oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema
        personenbezogene Daten können Sie sich jederzeit an uns wenden.
      </P>

      <H3>Recht auf Einschränkung der Verarbeitung</H3>
      <P>
        Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen
        Daten zu verlangen. Hierzu können Sie sich jederzeit an uns wenden. Das Recht auf
        Einschränkung der Verarbeitung besteht in folgenden Fällen:
      </P>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink-2">
        <li>
          Wenn Sie die Richtigkeit Ihrer bei uns gespeicherten personenbezogenen Daten
          bestreiten, benötigen wir in der Regel Zeit, um dies zu überprüfen. Für die Dauer
          der Prüfung haben Sie das Recht, die Einschränkung der Verarbeitung Ihrer
          personenbezogenen Daten zu verlangen.
        </li>
        <li>
          Wenn die Verarbeitung Ihrer personenbezogenen Daten unrechtmäßig geschah/geschieht,
          können Sie statt der Löschung die Einschränkung der Datenverarbeitung verlangen.
        </li>
        <li>
          Wenn wir Ihre personenbezogenen Daten nicht mehr benötigen, Sie sie jedoch zur
          Ausübung, Verteidigung oder Geltendmachung von Rechtsansprüchen benötigen, haben
          Sie das Recht, statt der Löschung die Einschränkung der Verarbeitung Ihrer
          personenbezogenen Daten zu verlangen.
        </li>
        <li>
          Wenn Sie einen Widerspruch nach Art. 21 Abs. 1 DSGVO eingelegt haben, muss eine
          Abwägung zwischen Ihren und unseren Interessen vorgenommen werden. Solange noch
          nicht feststeht, wessen Interessen überwiegen, haben Sie das Recht, die
          Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.
        </li>
      </ul>
      <P>
        Wenn Sie die Verarbeitung Ihrer personenbezogenen Daten eingeschränkt haben, dürfen
        diese Daten – von ihrer Speicherung abgesehen – nur mit Ihrer Einwilligung oder zur
        Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen oder zum Schutz der
        Rechte einer anderen natürlichen oder juristischen Person oder aus Gründen eines
        wichtigen öffentlichen Interesses der Europäischen Union oder eines Mitgliedstaats
        verarbeitet werden.
      </P>

      <H3>SSL- bzw. TLS-Verschlüsselung</H3>
      <P>
        Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung
        vertraulicher Inhalte, wie zum Beispiel Anfragen, die Sie an uns als Seitenbetreiber
        senden, eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen
        Sie daran, dass die Adresszeile des Browsers von „http://" auf „https://" wechselt
        und an dem Schloss-Symbol in Ihrer Browserzeile.
      </P>
      <P>
        Wenn die SSL- bzw. TLS-Verschlüsselung aktiviert ist, können die Daten, die Sie an
        uns übermitteln, nicht von Dritten mitgelesen werden.
      </P>

      <H2>4. Datenerfassung auf dieser Website</H2>

      <H3>Early-Access-Formular</H3>
      <P>
        Wenn Sie sich über das Early-Access-Formular eintragen, werden die von Ihnen
        angegebenen Daten (Name und E-Mail-Adresse) bei uns gespeichert, um Sie über den
        Start der UNPLND App zu informieren. Diese Daten geben wir nicht ohne Ihre
        Einwilligung weiter.
      </P>
      <P>
        Die Verarbeitung dieser Daten erfolgt auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1
        lit. a DSGVO); die Einwilligung ist jederzeit widerrufbar. Die Daten verbleiben bei
        uns, bis Sie uns zur Löschung auffordern, Ihre Einwilligung zur Speicherung
        widerrufen oder der Zweck für die Datenspeicherung entfällt (z.&nbsp;B. nach
        erfolgter Launch-Benachrichtigung). Zwingende gesetzliche Bestimmungen bleiben
        unberührt.
      </P>
      <P>
        Für die Speicherung der Einträge setzen wir Supabase als Auftragsverarbeiter ein
        (Anbieter: Supabase, Inc.). Weitere Informationen finden Sie in der
        Datenschutzerklärung von Supabase unter:{' '}
        <a
          href="https://supabase.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-terra-ink underline decoration-terra/40 underline-offset-2 hover:text-heading"
        >
          https://supabase.com/privacy
        </a>
      </P>

      <H3>Anfrage per E-Mail oder Telefon</H3>
      <P>
        Wenn Sie uns per E-Mail oder Telefon kontaktieren, wird Ihre Anfrage inklusive aller
        daraus hervorgehenden personenbezogenen Daten (Name, Anfrage) zum Zwecke der
        Bearbeitung Ihres Anliegens bei uns gespeichert und verarbeitet. Diese Daten geben
        wir nicht ohne Ihre Einwilligung weiter.
      </P>
      <P>
        Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO,
        sofern Ihre Anfrage mit der Erfüllung eines Vertrags zusammenhängt oder zur
        Durchführung vorvertraglicher Maßnahmen erforderlich ist. In allen übrigen Fällen
        beruht die Verarbeitung auf unserem berechtigten Interesse an der effektiven
        Bearbeitung der an uns gerichteten Anfragen (Art. 6 Abs. 1 lit. f DSGVO) oder auf
        Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), sofern diese abgefragt wurde; die
        Einwilligung ist jederzeit widerrufbar.
      </P>
      <P>
        Die von Ihnen an uns per Kontaktanfragen übersandten Daten verbleiben bei uns, bis
        Sie uns zur Löschung auffordern, Ihre Einwilligung zur Speicherung widerrufen oder
        der Zweck für die Datenspeicherung entfällt (z.&nbsp;B. nach abgeschlossener
        Bearbeitung Ihres Anliegens). Zwingende gesetzliche Bestimmungen – insbesondere
        gesetzliche Aufbewahrungsfristen – bleiben unberührt.
      </P>

      <H2>5. Analyse-Tools, Plugins und Tools</H2>

      <H3>Vercel Web Analytics</H3>
      <P>
        Diese Website nutzt Vercel Web Analytics, einen Analysedienst der Vercel Inc., 440 N
        Barranca Ave #4133, Covina, CA 91723, USA. Erfasst werden aggregierte Informationen
        wie aufgerufene Seiten, Referrer, Land, Browser- und Gerätetyp. Vercel Web Analytics
        verwendet keine Cookies und speichert keine personenbezogenen Identifikatoren; die
        Zuordnung von Seitenaufrufen erfolgt über einen kurzlebigen Hash, der keine
        geräteübergreifende Wiedererkennung erlaubt. Die Verarbeitung erfolgt auf Grundlage
        unseres berechtigten Interesses an der statistischen Analyse und Verbesserung
        unseres Online-Angebots (Art. 6 Abs. 1 lit. f DSGVO). Weitere Informationen:{' '}
        <a
          href="https://vercel.com/docs/analytics/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-terra-ink underline decoration-terra/40 underline-offset-2 hover:text-heading"
        >
          https://vercel.com/docs/analytics/privacy-policy
        </a>
      </P>

      <H3>Schriftarten (lokales Hosting)</H3>
      <P>
        Diese Seite nutzt zur einheitlichen Darstellung von Schriftarten die Schriftart
        Inter. Die Schriftart ist lokal installiert. Eine Verbindung zu Servern von
        Drittanbietern findet dabei nicht statt.
      </P>

      <H3>Externe Verlinkungen</H3>
      <P>
        Unsere Website enthält Links zu unseren Profilen auf TikTok und Instagram. Beim
        bloßen Aufruf unserer Website werden keine Daten an diese Anbieter übertragen. Erst
        wenn Sie einen dieser Links anklicken, gelangen Sie auf die jeweilige Plattform; es
        gelten dann die Datenschutzbestimmungen des jeweiligen Anbieters.
      </P>

      <P>
        <span className="mt-8 block text-[13.5px] text-ink-2">Stand: Juli 2026</span>
      </P>
    </>
  );
}
