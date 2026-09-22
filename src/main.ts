import ZoomVideo, { VideoPlayer, VideoQuality } from "@zoom/videosdk";
import "./style.css";

const videoContainer = document.querySelector('video-player-container') as HTMLElement;
const sessionName = "TestSession";
const role = 1;
const username = `User-${String(new Date().getTime()).slice(6)}`;
const client = ZoomVideo.createClient();
await client.init("en-US", "Global", { patchJsMedia: true });

const readJsonResponse = async <T>(response: Response, requestName: string): Promise<T> => {
    const responseText = await response.text();
    if (!response.ok) {
        throw new Error(`${requestName} failed (${response.status}): ${responseText || response.statusText}`);
    }
    if (!responseText) {
        throw new Error(`${requestName} returned an empty response. Make sure the local API server is running.`);
    }
    try {
        return JSON.parse(responseText) as T;
    } catch {
        throw new Error(`${requestName} returned an invalid response.`);
    }
};

const startCall = async () => {
    // ask the server which token endpoint to use, since it is the one reading the .env file
    const configResponse = await fetch("/api/config");
    const { endpointUrl } = await readJsonResponse<{ endpointUrl: string | null }>(configResponse, "Configuration request");

    // get a token to join the session from the backend, or prompt for one if no endpoint is configured
    let token: string;
    if (endpointUrl) {
        const response = await fetch(endpointUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionName, role }),
        });
        const data = await readJsonResponse<{ token?: string }>(response, "Token request");
        if (!data.token) {
            throw new Error("Token request completed without a token.");
        }
        token = data.token;
    } else {
        token = window.prompt("Enter JWT Token") ?? "";
    }
    // call the renderVideo function whenever a user joins or leaves
    client.on("peer-video-state-change", renderVideo);
    await client.join(sessionName, token, username);
    const mediaStream = client.getMediaStream();
    await mediaStream.startAudio();
    await mediaStream.startVideo();

    const processor = await mediaStream.createProcessor({
        name: "gl-processor",
        type: "video",
        url: window.location.origin + "/od-quad.js",
    });
    // Add a processor
    await mediaStream.addProcessor(processor);
    // render the video of the current user
    await renderVideo({ action: 'Start', userId: client.getCurrentUserInfo().userId });
};

const renderVideo = async (event: { action: "Start" | "Stop"; userId: number; }) => {
    const mediaStream = client.getMediaStream();
    if (event.action === 'Stop') {
        const element = await mediaStream.detachVideo(event.userId);
        Array.isArray(element) ? element.forEach((el) => el.remove()) : element.remove();
    } else {
        const userVideo = await mediaStream.attachVideo(event.userId, VideoQuality.Video_360P);
        videoContainer.appendChild(userVideo as VideoPlayer);
    }
};

const leaveCall = async () => {
    const mediaStream = client.getMediaStream();
    for (const user of client.getAllUser()) {
        const element = await mediaStream.detachVideo(user.userId);
        Array.isArray(element) ? element.forEach((el) => el.remove()) : element.remove();
    }
    client.off("peer-video-state-change", renderVideo);
    await client.leave();
}

const toggleVideo = async () => {
    const mediaStream = client.getMediaStream();
    if (mediaStream.isCapturingVideo()) {
        await mediaStream.stopVideo();
        // update the canvas when the video is stopped
        await renderVideo({ action: 'Stop', userId: client.getCurrentUserInfo().userId });
    } else {
        await mediaStream.startVideo();
        // update the canvas when the video is started
        await renderVideo({ action: 'Start', userId: client.getCurrentUserInfo().userId });
    }
};

// UI Logic
const startBtn = document.querySelector("#start-btn") as HTMLButtonElement;
const stopBtn = document.querySelector("#stop-btn") as HTMLButtonElement;
const toggleVideoBtn = document.querySelector("#toggle-video-btn") as HTMLButtonElement;
const videoSection = document.querySelector("#video-section") as HTMLElement;

startBtn.addEventListener("click", async () => {
    startBtn.innerHTML = "Connecting...";
    startBtn.disabled = true;
    try {
        await startCall();
        startBtn.innerHTML = "Connected";
        startBtn.style.display = "none";
        stopBtn.style.display = "block";
        toggleVideoBtn.style.display = "block";
        videoSection.style.display = "block";
    } catch (error) {
        console.error("Unable to join the Zoom session", error);
        window.alert(error instanceof Error ? error.message : "Unable to join the Zoom session.");
        startBtn.innerHTML = "Join";
        startBtn.disabled = false;
    }
});

stopBtn.addEventListener("click", async () => {
    toggleVideoBtn.style.display = "none";
    await leaveCall();
    stopBtn.style.display = "none";
    videoSection.style.display = "none";
    startBtn.style.display = "block";
    startBtn.innerHTML = "Join";
    startBtn.disabled = false;
});

toggleVideoBtn.addEventListener("click", async () => {
    await toggleVideo();
});