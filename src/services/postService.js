const postRepository = require("../repositories/postRepository");

async function fetchUrlContent(url) {
    const response = await fetch(url);
    if (!response.ok) {
        const error = new Error(
            `Failed to fetch URL: ${response.status} ${response.statusText}`
        );
        error.statusCode = 400;
        throw error;
    }
    return response.text();
}

async function ingestPost({ url, markdown }) {
    if (url) {
        const content = await fetchUrlContent(url);
        return postRepository.createPost(url, content);
    }
    return postRepository.createPost("markdown-paste", markdown);
}

function getPost(id) {
    return postRepository.findPostById(id);
}

module.exports = { ingestPost, getPost };