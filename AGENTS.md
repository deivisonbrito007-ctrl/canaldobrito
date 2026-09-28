# Project Architecture Rules

- Sports programming is sourced only from the manual text/image review flow; external schedule providers must not be reintroduced because they caused excessive polling and database load.
- Public schedule freshness uses database realtime plus focus/reconnect refetching, not interval polling, to avoid duplicate background traffic.
- Trailer availability is cached for the browser session so page reloads do not repeat provider requests for the same catalog items.