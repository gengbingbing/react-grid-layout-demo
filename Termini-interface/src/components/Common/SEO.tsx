import { Helmet } from "react-helmet";
import { t } from "@lingui/macro";

function SEO(props) {
  const { children, ...customMeta } = props;
  const meta = {
    title: t`Termini | Native One-stop trading Platform build on Soneium`,
    description: t`One-stop trading Platform on @soneium, offering AMM, Perp, AI Agent launch, and Meme Launch.`,
    image: "https://raw.githubusercontent.com/TerminiLabs/Termini-assets/refs/heads/main/logo/og.png",
    type: "exchange",
    ...customMeta,
  };
  return (
    <>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="robots" content="follow, index" />
        <meta content={meta.description} name="description" />
        <meta property="og:type" content={meta.type} />
        <meta property="og:site_name" content="Termini" />
        <meta property="og:description" content={meta.description} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:image" content={meta.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Termini_one" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
      </Helmet>
      {children}
    </>
  );
}

export default SEO;
