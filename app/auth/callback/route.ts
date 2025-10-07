import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { setUserCookie } from "@/lib/auth/cookie";
import { authLogger } from "@/lib/logger";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

  // Check for OAuth errors first
  const error = requestUrl.searchParams.get("error");
  const errorCode = requestUrl.searchParams.get("error_code");
  const errorDescription = requestUrl.searchParams.get("error_description");

  if (error) {
    authLogger.error("OAuth callback error", {
      error,
      errorCode,
      errorDescription,
      url: requestUrl.toString(),
    });
    return NextResponse.redirect(
      `${origin}/auth/error?error=${error}&error_code=${errorCode}&error_description=${errorDescription}`
    );
  }

  authLogger.info("Auth callback started", { hasCode: !!code, redirectTo });

  if (code) {
    const supabase = await createClient();

    authLogger.info("Exchanging code for session");
    const { error: exchangeError, data } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      authLogger.error("Failed to exchange code for session", {
        error: exchangeError.message,
        status: exchangeError.status,
        code: exchangeError.code,
      });
      return NextResponse.redirect(`${origin}/auth/error`);
    }

    if (!data.session) {
      authLogger.error("No session data after code exchange");
      return NextResponse.redirect(`${origin}/auth/error`);
    }

    authLogger.info("Session created successfully", {
      userId: data.session.user.id,
      email: data.session.user.email,
    });

    // Check if user profile is complete
    authLogger.info("Fetching user data from database", {
      userId: data.session.user.id,
    });
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, name, phone, role")
      .eq("id", data.session.user.id)
      .single();

    if (userError) {
      authLogger.error("Failed to fetch user data", {
        error: userError.message,
        code: userError.code,
        userId: data.session.user.id,
      });
    }

    if (userData) {
      authLogger.info("User data found", {
        userId: userData.id,
        email: userData.email,
        role: userData.role,
        hasPhone: !!userData.phone,
      });
      // Get photographer info if applicable
      let photographerData = null;
      if (userData.role === "photographer") {
        const { data } = await supabase
          .from("photographers")
          .select("approval_status, profile_image_url")
          .eq("id", userData.id)
          .single();

        photographerData = data;
      }

      // Set user cookie for new auth system
      try {
        await setUserCookie({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          role: userData.role as "user" | "photographer" | "admin",
          approvalStatus: photographerData?.approval_status,
          profileImageUrl: photographerData?.profile_image_url || undefined,
        });
        authLogger.info("User cookie set after OAuth login", {
          userId: userData.id,
        });
      } catch (cookieError) {
        authLogger.error("Failed to set user cookie", { error: cookieError });
      }
    }

    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";

    let finalRedirect = redirectTo ?? "/";

    // If profile is incomplete (no phone), redirect to profile completion
    // But skip for photographers and admins (they have their own flows)
    if (!userData?.phone && userData?.role === "user") {
      finalRedirect = "/profile/complete";
    }

    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${finalRedirect}`);
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${finalRedirect}`);
    } else {
      return NextResponse.redirect(`${origin}${finalRedirect}`);
    }
  }
  return NextResponse.redirect(`${origin}/auth/error`);
}
