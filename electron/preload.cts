import { contextBridge } from 'electron';
import type { DesktopAPI } from '../types/desktop';
contextBridge.exposeInMainWorld('desktop', Object.freeze({ platform: process.platform } satisfies DesktopAPI));
