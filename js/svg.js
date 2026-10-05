(() => {
  "use strict";

  const ALLOWED_ELEMENTS = new Set([
    "svg","g","path","circle","ellipse","line","polyline","polygon","rect",
    "text","tspan","title","desc","defs","marker","linearGradient","radialGradient","stop"
  ]);

  const ALLOWED_ATTRIBUTES = new Set([
    "xmlns","viewBox","width","height","role","aria-label","fill","fill-opacity",
    "stroke","stroke-width","stroke-linecap","stroke-linejoin","stroke-dasharray",
    "stroke-dashoffset","stroke-opacity","opacity","x","y","x1","y1","x2","y2",
    "cx","cy","r","rx","ry","points","d","transform","text-anchor",
    "dominant-baseline","font-family","font-size","font-weight","letter-spacing",
    "marker-start","marker-mid","marker-end","offset","stop-color","stop-opacity",
    "gradientUnits","gradientTransform","spreadMethod","refX","refY","markerWidth",
    "markerHeight","orient","id"
  ]);

  const MAX_CHARS = 120000;

  function isSafeAttribute(name, value) {
    const lower = name.toLowerCase();
    if (!ALLOWED_ATTRIBUTES.has(name)) return false;
    if (lower.startsWith("on")) return false;
    if (lower === "href" || lower === "xlink:href") return false;
    if (/url\s*\(/i.test(value)) {
      // Permit only local fragment references such as url(#arrow).
      return /^url\(#[A-Za-z0-9_-]+\)$/.test(value.trim());
    }
    return true;
  }

  function sanitize(svgString) {
    if (typeof svgString !== "string" || !svgString.trim()) {
      throw new Error("SVG is empty.");
    }
    if (svgString.length > MAX_CHARS) {
      throw new Error("SVG exceeds the 120,000-character safety limit.");
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    if (doc.querySelector("parsererror")) throw new Error("Invalid SVG.");
    const root = doc.documentElement;
    if (!root || root.nodeName.toLowerCase() !== "svg") throw new Error("SVG root element is missing.");

    const all = [...doc.querySelectorAll("*")];
    for (const el of all) {
      const tag = el.localName.toLowerCase();
      if (!ALLOWED_ELEMENTS.has(tag)) {
        el.remove();
        continue;
      }
      for (const attr of [...el.attributes]) {
        if (!isSafeAttribute(attr.name, attr.value)) el.removeAttribute(attr.name);
      }
    }

    root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    root.setAttribute("role", "img");
    return root;
  }

  window.SVGGuard = { sanitize, MAX_CHARS };
})();