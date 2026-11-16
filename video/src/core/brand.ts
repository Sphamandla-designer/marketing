// A Brand is everything a campaign needs to look like itself. To start a new
// campaign (AX-Channels, NeuraUX, ...), add a file in src/brands that exports
// one of these and put its logo and fonts under public/.
export type FontFace = {
  family: string;
  file: string; // path under public/
  weight: string; // "400" or a variable range such as "100 900"
  style?: "normal" | "italic";
};

export type Brand = {
  id: string;
  name: string;
  colors: {
    base: string; // main dark field
    baseDeep: string; // darker edge of the field
    hero: string; // the one accent colour
    text: string;
    textDim: string;
    line: string; // hairlines
  };
  fonts: {
    display: string;
    mono: string;
    faces: FontFace[];
  };
  logo: {
    file: string; // path under public/, for use on the dark field
    width: number; // intrinsic pixels
    height: number;
  };
};
