const { createServerClient, parseCookieHeader, serializeCookieHeader } = require('@supabase/ssr')

exports.createClient = (context) => {
  return createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(context.req.headers.cookie ?? '')
        },

        setAll(cookiesToSet) {
          console.log("Setting cookies: ", cookiesToSet);
          const cookies = cookiesToSet.map(({ name, value, options }) =>
            serializeCookieHeader(name, value, {
              ...options,
              sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
              secure: true,
              path: "/"
            })
          )

          context.res.setHeader("Set-Cookie", cookies)
        }
      }
    }
  )
}