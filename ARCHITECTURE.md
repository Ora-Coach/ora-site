# Ora Web Architecture

`ora-site` is the public marketing, SEO, privacy, and support website for Ora at
`https://oracoach.app`. It is intentionally static and public.

The authenticated Ora product must be deployed separately from a private source
repository, either the private `ora` app repository or a separate private web app
repository. The intended app URL is:

```text
https://app.oracoach.app
```

Do not add private app source code, backend source code, Firebase Functions,
Supabase service keys, Firebase Admin credentials, OpenAI keys, coaching prompts,
entitlement logic, internal configs, environment files, private notes, or compiled
app artifacts to this repository.

Frontend code shipped to browsers is visible to users. Public client
configuration can be present only when it is intended for browser delivery, but
secrets and privileged credentials must never be placed in client code or this
public repository.

Access permissions must be enforced by backend services, database security rules,
storage rules, and authenticated APIs. Client-side routing, hidden buttons, or UI
checks are not sufficient authorization boundaries.

`oracoach.app` should link users to the app subdomain for invited beta access and
keep support/privacy pages on the public marketing site. DNS and hosting for
`app.oracoach.app` should be configured from the private app deployment, not from
this static website repository.
