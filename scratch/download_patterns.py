import urllib.request
import os

light_url = "https://lh3.googleusercontent.com/aida/AP1WRLu6c1eOBycoOhr8d1SXuiHHJ2p6UFS7W2aOZkBXjny6fvIs_6xymLzH0UsMR7FkOSpmq8iA3Rgj70jVG88PGuJNINDzY5gsPYOgnDgBh3IcKArWymKf-uL7T7agVDPUQUJOCSw0gvHUm-wOQkE9H9OVVAAbstEFTKz5Z8_Lg8OSzO2KJuFfVFtK3doqWktfqKKktFzNLf_TzWkD-TcfU94V1-qBjNCjlurGOnhw60gdCD9fBNRYgHzWMpMp"
dark_url = "https://lh3.googleusercontent.com/aida/AP1WRLu_foWMwnMlqlxq-jsEwNaqub3k215L_EAy1g9btiAZtZ-vC6ctgnJDoX8wnoedlLjZLvxGBbofAjGnMf_dRJvEe1l5avwp0Eo5waH3l_00K1ufBPSmlJVaGf7Cct4WRPY63LuqnSJ6HUc0hkcppk5dzmsmrPaiapy336v6Yh3lNvvAXDOcQtNm0p5hZVT5IuPV1iLZpy57dRptdN6lHBnOX9SlAwnVO4c48uoRoPg_s27yUgpT632cGXFn"

output_dir = r"c:\Users\minhb\OneDrive\Desktop\phovietkhang\images"
light_path = os.path.join(output_dir, "pattern-light.png")
dark_path = os.path.join(output_dir, "pattern-dark.png")

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
}

def download_image(url, path):
    print(f"Downloading {url} to {path}...")
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            data = response.read()
            with open(path, 'wb') as f:
                f.write(data)
            print("Download successful.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    download_image(light_url, light_path)
    download_image(dark_url, dark_path)
