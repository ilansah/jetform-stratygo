const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = 'Service Accréditation <adv@stratygo.fr>';

/**
 * Sends an approval email to the user.
 * @param {string} to - Recipient email
 * @param {string} name - User's full name
 */
async function sendApprovalEmail(to, name) {
    try {
        const { data, error } = await resend.emails.send({
            from: EMAIL_FROM,
            to: [to],
            subject: 'Accréditation Approuvée - Stratygo',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #2d8a5b; margin: 0;">Félicitations !</h2>
                    </div>
                    <p>Bonjour <strong>${name}</strong>,</p>
                    <p>Nous avons le plaisir de vous informer que votre demande d'accréditation a été <strong>validée</strong>.</p>
                    <p>Vous pouvez dès à présent accéder à vos outils et commencer votre activité.</p>
                    <div style="margin: 30px 0; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #2d8a5b; border-radius: 4px;">
                        <p style="margin: 0; font-weight: bold; color: #166534;">Votre statut est maintenant : Approuvé</p>
                    </div>
                    <p>Si vous avez des questions, n'hésitez pas à contacter votre manager ou le service RH.</p>
                    <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
                        Ceci est un message automatique, merci de ne pas y répondre directement.<br>
                        © ${new Date().getFullYear()} Stratygo. Tous droits réservés.
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('Resend Error (Approval):', error);
            return { success: false, error };
        }

        console.log('Approval email sent:', data);
        return { success: true, data };
    } catch (err) {
        console.error('Email Service Error (Approval):', err);
        return { success: false, error: err };
    }
}

/**
 * Sends a refusal email to the user with a reason.
 * @param {string} to - Recipient email
 * @param {string} name - User's full name
 * @param {string} reason - Reason for refusal
 */
async function sendRefusalEmail(to, name, reason) {
    try {
        const { data, error } = await resend.emails.send({
            from: EMAIL_FROM,
            to: [to],
            subject: 'Mise à jour concernant votre accréditation - Stratygo',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #dc2626; margin: 0;">Demande Refusée</h2>
                    </div>
                    <p>Bonjour <strong>${name}</strong>,</p>
                    <p>Nous vous informons que votre demande d'accréditation n'a pas pu être validée pour le moment.</p>
                    <div style="margin: 30px 0; padding: 15px; background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 4px;">
                        <strong style="display: block; color: #991b1b; margin-bottom: 5px;">Motif du refus :</strong>
                        <p style="margin: 0; color: #7f1d1d;">${reason || "Non spécifié"}</p>
                    </div>
                    <p>Veuillez corriger les éléments indiqués ou contacter votre responsable pour plus d'informations. Vous pourrez soumettre une nouvelle demande une fois les modifications effectuées.</p>
                    <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
                        Ceci est un message automatique, merci de ne pas y répondre directement.<br>
                        © ${new Date().getFullYear()} Stratygo. Tous droits réservés.
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('Resend Error (Refusal):', error);
            return { success: false, error };
        }

        console.log('Refusal email sent:', data);
        return { success: true, data };
    } catch (err) {
        console.error('Email Service Error (Refusal):', err);
        return { success: false, error: err };
    }
}

module.exports = { sendApprovalEmail, sendRefusalEmail };
