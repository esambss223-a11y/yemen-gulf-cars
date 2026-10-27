// Print the dedicated body-level document, after its assets finish loading.
export async function printContract(element: HTMLElement, title: string): Promise<void> {
  await Promise.all(Array.from(element.querySelectorAll('img')).map(async (image) => {
    if (!image.complete) await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('تعذر تحميل شعار العقد. حاول مجددًا.'));
    });
    if (!image.naturalWidth) throw new Error('تعذر تحميل شعار العقد.');
    await image.decode();
  }));
  await document.fonts.ready;
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  const previousTitle = document.title;
  document.title = title;
  const restore = () => { document.title = previousTitle; clearTimeout(timer); window.removeEventListener('afterprint', restore); };
  const timer = setTimeout(restore, 300000);
  window.addEventListener('afterprint', restore, { once: true });
  try { window.print(); } catch (error) { restore(); throw error; }
}
