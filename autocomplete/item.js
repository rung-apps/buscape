export default function ({ input, lib }) {
    return lib.request.get('https://app.rung.com.br/buscape-autocomplete')
        .query({ q: input })
        .then(({ body }) => body.palavras);
}
