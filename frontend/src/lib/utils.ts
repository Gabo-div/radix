import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Un videojuego de la biblioteca es un único .html autocontenido; solo esos
// archivos pueden marcarse como juego al subirse.
export function isHtmlFilename(name: string) {
  return /\.html?$/i.test(name);
}
