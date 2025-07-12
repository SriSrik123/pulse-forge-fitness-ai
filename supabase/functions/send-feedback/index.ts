import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeedbackRequest {
  feedback: string;
  feedbackType: string;
  userEmail: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received feedback request");
    const { feedback, feedbackType, userEmail, userId }: FeedbackRequest = await req.json();

    if (!feedback?.trim()) {
      throw new Error("Feedback is required");
    }

    console.log("Sending feedback email to hellosri2006@gmail.com");
    
    const emailResponse = await resend.emails.send({
      from: "PulseTrack Feedback <onboarding@resend.dev>",
      to: ["hellosri2006@gmail.com"],
      subject: `PulseTrack Feedback - ${feedbackType}`,
      html: `
        <h2>New Feedback from PulseTrack</h2>
        <p><strong>Type:</strong> ${feedbackType}</p>
        <p><strong>User Email:</strong> ${userEmail}</p>
        <p><strong>User ID:</strong> ${userId}</p>
        <p><strong>Feedback:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          ${feedback.replace(/\n/g, '<br>')}
        </div>
        <p><em>Sent from PulseTrack App</em></p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-feedback function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);