# Reliable deployment, customer-activated trials, and QuoteFlow redesign

## Outcome

- Render starts the built app reliably instead of stopping after a successful build.
- New accounts remain in a pending trial state with no countdown.
- The seven-day trial starts only when the first non-test quote is submitted through the business’s public link.
- Test-link submissions never activate or extend the trial.
- The dashboard clearly shows whether the trial is pending, active, expired, or paid.
- The selected Fluent workflow style and a reusable QuoteFlow logo appear consistently across the public site, sign-in, dashboard, upgrade, and customer quote page.

## Build steps

1. Correct the Render runtime output and start command, preserving required environment settings.
2. Add a safe database migration for pending trials and one-time activation on the first real quote.
3. Update signup, billing, dashboard, and quote submission logic to reflect the new trial lifecycle.
4. Create a shared QuoteFlow logo/brand header and apply the selected bright, polished workflow design across all screens.
5. Verify public and authenticated behavior, deployment output, metadata, and mobile/desktop layouts.

## Technical details

- Trial activation will be enforced in the database so it cannot be bypassed by browser requests.
- Activation will be atomic and idempotent: only `is_test = false` can set the first start and expiry timestamps.
- Existing paid accounts remain paid; existing active trial dates are preserved.
- Render will build the Node server target and launch the actual generated server entry.
