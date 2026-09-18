import { admin, getUser, getIdentityConfig } from "@netlify/identity";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function rolesOf(user) {
  return Array.isArray(user?.roles) ? user.roles :
    (Array.isArray(user?.appMetadata?.roles) ? user.appMetadata.roles :
    (Array.isArray(user?.app_metadata?.roles) ? user.app_metadata.roles : []));
}

function roleOf(user) {
  const roles = rolesOf(user);
  if (roles.includes("superadmin")) return "superadmin";
  if (roles.includes("admin")) return "admin";
  return "none";
}

function ownerEmail() {
  return String(process.env.SCHOOL_OWNER_EMAIL || "").trim().toLowerCase();
}

function isOwner(user) {
  const email = String(user?.email || "").trim().toLowerCase();
  const configured = ownerEmail();
  return !!configured && !!email && email === configured;
}

function temporaryPassword() {
  return `${crypto.randomUUID()}Aa1!`;
}

function cleanUser(user) {
  return {
    id: user.id,
    email: user.email || "",
    name: user.name || user.userMetadata?.full_name || user.user_metadata?.full_name || "",
    role: roleOf(user),
    isOwner: isOwner(user),
    createdAt: user.createdAt || "",
    lastSignInAt: user.lastSignInAt || "",
  };
}

export default async (request, context) => {
  try {
    const currentUser = await getUser();
    if (!currentUser) return json({ error: "Unauthorized. Please log in." }, 401);

    // Netlify Identity caps per_page at 500. Fetch all pages so the
    // administrator list keeps working even if the site has many users.
    let users = [];
    for (let page = 1; page <= 20; page++) {
      const batch = await admin.listUsers({ page, perPage: 500 });
      if (!Array.isArray(batch) || batch.length === 0) break;
      users.push(...batch);
      if (batch.length < 500) break;
    }
    const current = await admin.getUser(currentUser.id);
    const currentRole = roleOf(current);
    const currentIsOwner = isOwner(current);

    if (currentRole !== "superadmin") {
      return json({ error: "Only Super Admins can manage administrators." }, 403);
    }

    const managed = users.filter(u => roleOf(u) !== "none");

    if (request.method === "GET") {
      return json({
        currentUserId: current.id,
        currentRole,
        currentIsOwner,
        ownerEmailConfigured: !!ownerEmail(),
        superAdminCount: managed.filter(u => roleOf(u) === "superadmin").length,
        users: managed.map(cleanUser)
      });
    }

    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const email = String(body.email || "").trim().toLowerCase();
      const name = String(body.name || "").trim();
      const requestedRole = body.role === "superadmin" ? "superadmin" : "admin";

      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return json({ error: "Enter a valid email address." }, 400);
      }

      if (users.some(u => String(u.email || "").toLowerCase() === email)) {
        return json({ error: "That email already has a Netlify Identity account." }, 409);
      }

      const superCount = users.filter(u => roleOf(u) === "superadmin").length;
      if (requestedRole === "superadmin" && superCount >= 5) {
        return json({ error: "You already have the maximum of 5 Super Admins." }, 400);
      }

      // Use Netlify's server-side Identity operator token. This is supplied
      // by the Netlify runtime through @netlify/identity; no environment
      // variable or user JWT is required. The /invite endpoint creates a real
      // Identity invitation and sends an invite_token email.
      const identity = getIdentityConfig();
      if (!identity?.url || !identity?.token) {
        return json({ error: "Netlify Identity operator access is unavailable. Please redeploy the site and try again." }, 503);
      }

      const inviteResponse = await fetch(`${identity.url}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${identity.token}`
        },
        body: JSON.stringify({ email })
      });

      const inviteText = await inviteResponse.text();
      let inviteData = {};
      try { inviteData = inviteText ? JSON.parse(inviteText) : {}; } catch {}

      if (!inviteResponse.ok) {
        return json({
          error: inviteData?.msg || inviteData?.message || inviteText ||
            "Netlify Identity could not send the invitation."
        }, inviteResponse.status || 502);
      }

      // GoTrue normally returns 204 for /invite, so there may be no user id
      // in the response. Look the newly invited user up by email, retrying
      // briefly because Identity propagation can be asynchronous.
      let invitedUser = null;
      for (let attempt = 0; attempt < 6; attempt++) {
        const all = [];
        for (let page = 1; page <= 20; page++) {
          const batch = await admin.listUsers({ page, perPage: 500 });
          if (!Array.isArray(batch) || batch.length === 0) break;
          all.push(...batch);
          if (batch.length < 500) break;
        }
        invitedUser = all.find(u => String(u.email || "").toLowerCase() === email) || null;
        if (invitedUser) break;
        await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
      }

      if (!invitedUser?.id) {
        return json({ error: "The invitation was sent, but Netlify Identity did not return the new user yet. Please refresh the administrator list before trying again." }, 202);
      }

      // The invite endpoint creates the Identity user. Now attach the
      // requested CMS role and optional name to that invited user.
      const updated = await admin.updateUser(invitedUser.id, {
        app_metadata: { roles: [requestedRole] },
        user_metadata: name ? { full_name: name } : {}
      });

      return json({
        success: true,
        user: cleanUser(updated),
        invitationSent: true
      }, 201);
    }

    if (request.method === "DELETE") {
      const id = String(new URL(request.url).searchParams.get("id") || "").trim();
      if (!id) return json({ error: "User id is required." }, 400);
      if (id === current.id) return json({ error: "You cannot remove your own account." }, 400);

      const target = await admin.getUser(id).catch(() => null);
      if (target && isOwner(target)) {
        return json({ error: "The School Owner is protected and can only be removed or changed through Netlify Identity." }, 403);
      }

      if (!target || roleOf(target) === "none") {
        return json({ error: "That user is not a managed administrator." }, 404);
      }

      if (roleOf(target) === "superadmin") {
        const count = users.filter(u => roleOf(u) === "superadmin").length;
        if (count <= 1) return json({ error: "At least 1 Super Admin must remain." }, 400);
      }

      await admin.deleteUser(id);
      return json({ success: true });
    }

    if (request.method === "PATCH") {
      const body = await request.json().catch(() => ({}));
      const id = String(body.id || "").trim();
      const requestedRole = body.role === "superadmin" ? "superadmin" : "admin";
      if (!id) return json({ error: "User id is required." }, 400);
      if (id === current.id && requestedRole !== "superadmin") {
        return json({ error: "You cannot demote your own Super Admin account." }, 400);
      }

      const target = await admin.getUser(id).catch(() => null);
      if (!target || roleOf(target) === "none") {
        return json({ error: "That user is not a managed administrator." }, 404);
      }

      if (isOwner(target)) {
        return json({ error: "The School Owner is protected and can only be changed through Netlify Identity." }, 403);
      }

      const superCount = users.filter(u => roleOf(u) === "superadmin").length;
      if (requestedRole === "superadmin" && roleOf(target) !== "superadmin" && superCount >= 5) {
        return json({ error: "You already have the maximum of 5 Super Admins." }, 400);
      }
      if (requestedRole !== "superadmin" && roleOf(target) === "superadmin" && superCount <= 1) {
        return json({ error: "At least 1 Super Admin must remain." }, 400);
      }

      const updated = await admin.updateUser(id, {
        app_metadata: { roles: [requestedRole] }
      });
      return json({ success: true, user: cleanUser(updated) });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: error?.message || "Internal server error" }, 500);
  }
};
