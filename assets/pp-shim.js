// n8ao imports `Pass` from the "postprocessing" library only for its optional N8AOPostPass.
// The game uses N8AOPass with Three.js' own EffectComposer, so this stub replaces that 600 kB dependency.
export class Pass {}
