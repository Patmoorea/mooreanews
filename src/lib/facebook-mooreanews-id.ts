/** ID Graph API page MooreaNews. */
export const MOOREANEWS_GRAPH_PAGE_ID = "350029589936";

/** ID dans les permaliens publics facebook.com/…/posts/… (Meta « nouvelle page »). */
export const MOOREANEWS_LINK_PAGE_ID =
  process.env.FACEBOOK_MOOREANEWS_LINK_PAGE_ID?.trim() || "1762281498446173";

export function mooreaNewsGraphPageId(): string {
  return MOOREANEWS_GRAPH_PAGE_ID;
}

export function mooreaNewsLinkPageId(): string {
  return MOOREANEWS_LINK_PAGE_ID;
}
