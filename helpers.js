import fetch from "node-fetch";
import { BASE_URL } from './config';

export const getJSONFromRelativeURL = (relativeURL) => {
  return fetch(`${BASE_URL}${relativeURL}`).then(res => res.json());
}