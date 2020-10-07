export const callApi = (
  endpoint: string,
  formData: FormData,
  cbThen: (json: any) => void,
  cbCatch: (e: any) => void
) =>
  fetch(endpoint, {
    method: "POST",
    body: formData,
    mode: "cors",
  })
    .then(async (resp) => {
      if (resp.status === 400) {
        const err = await resp.text();
        throw new Error(err);
      }
      if (resp.status !== 200) {
        throw new Error(resp.statusText);
      }
      return resp.json();
    })
    .then(cbThen)
    .catch(cbCatch);
