# ফিউচার রোডম্যাপ ও ইমপ্রুভমেন্ট গাইড (Future Improvements & Roadmap)

এই প্রজেক্টটিকে ভবিষ্যতে আরও বড় পরিসরে প্রোডাকশন-রেডি (Production-Ready) ও এন্টারপ্রাইজ স্কেলে নিয়ে যাওয়ার জন্য প্রয়োজনীয় আইডিয়া এবং গাইডলাইন নিচে সাজিয়ে দেওয়া হলো:

---

## ১. SFU আর্কিটেকচার (১০০ থেকে ৫০০+ ইউজার হ্যান্ডেল করার জন্য) 🚀

### কেন দরকার?
* বর্তমানে অ্যাপটি **WebRTC Full-Mesh** সিস্টেমে কাজ করে।
* Mesh সিস্টেমে প্রতিজন ইউজার অন্য সবার কাছে সরাসরি ভিডিও পাঠায় ($N \times (N-1)$ কানেকশন)। ১০ জনের বেশি হলে ইউজারের ইন্টারনেট ও ডিভাইসের CPU ক্র্যাশ করে।
* **SFU (Selective Forwarding Unit)** আর্কিটেকচারে প্রতিজন ইউজার মাত্র **১ বার** সেন্ট্রাল সার্ভারে ভিডিও পাঠাবে, এবং সার্ভার সেটি সবার কাছে অপ্টিমাইজড বিটরেটে ফরোয়ার্ড করবে।

### কীভাবে করবে (Best Open-Source Approach - LiveKit):
1. **VPS / Cloud Server Setup:**
   * VPS-এ Docker দিয়ে LiveKit ওপেন-সোর্স সার্ভার রান করা:
     ```bash
     docker run -d --name livekit-server \
       -p 7880:7880 \
       -p 7881:7881 \
       -p 7882:7882/udp \
       livekit/livekit-server --dev
     ```
2. **NestJS Backend Integration:**
   * প্যাকেজ: `npm install livekit-server-sdk`
   * কন্ট্রোলারে JWT রুম অ্যাক্সেস টোকেন জেনারেট করার এন্ডপয়েন্ট তৈরি করা।
3. **Next.js Frontend Integration:**
   * প্যাকেজ: `npm install @livekit/components-react livekit-client`
   * আমাদের বর্তমান `CallOverlay` UI-র সাথে LiveKit এর কানেকশন হুক লিঙ্ক করা।

---

## ২. সেলফ-হোস্টেড TURN সার্ভার (Coturn) 🌐

### কেন দরকার?
* মোবাইল ডাটা (4G/5G), কর্পোরেট ওয়াইফাই বা ফায়ারওয়ালের পেছনে (Symmetric NAT) STUN দিয়ে পিয়ার কানেকশন অনেক সময় ফেইল করে।
* একটি সেলফ-হোস্টেড TURN সার্ভার থাকলে ১০০% সময়েই কোনো বাধা ছাড়াই কল কানেক্ট হবে।

### কীভাবে করবে:
* VPS-এ `coturn` প্যাকেজ ইনস্টল ও কনফিগার করা (`turnserver.conf`):
  ```bash
  sudo apt-get install coturn
  ```
* [CallContext.tsx](file:///c:/Users/Hasibul%20Islam/Projects/practice/chat-calling/frontend-nextjs/src/context/CallContext.tsx)-এর `iceServers` অ্যারেতে ইউজারনেম ও ক্রেডেনশিয়ালসহ TURN URL যুক্ত করা:
  ```typescript
  {
    urls: 'turn:your-domain-or-ip:3478',
    username: 'turn_user',
    credential: 'turn_password'
  }
  ```

---

## ৩. ভার্চুয়াল ব্যাকগ্রাউন্ড এবং ব্লার ইফেক্ট (Virtual Background / Blur) 🎭

### কেন দরকার?
* ভিডিও কলের সময় ইউজার নিজের পেছনের ব্যাকগ্রাউন্ড ব্লার করতে পারবে বা কাস্টম ছবি বসাতে পারবে (Google Meet / Zoom-এর মতো)।

### কীভাবে করবে:
* ব্রাউজারে `@mediapipe/selfie_segmentation` বা `@tensorflow-models/body-segmentation` ব্যবহার করে লোকাল ভিডিও ট্র্যাক প্রসেস করা এবং ক্যানভাসে ড্র করে নতুন `MediaStream` তৈরি করা।

---

## ৪. ক্লাউড রেকর্ডিং ও লাইভ স্ট্রিমিং (Cloud Recording / Egress) 🔴

### কেন দরকার?
* মিটিং বা লাইভ সেশন রেকর্ড করে MP4 ফরম্যাটে S3 / Cloudinary-তে সেভ করা অথবা YouTube/Facebook-এ RTMP দিয়ে লাইভ স্ট্রিম করা।

### কীভাবে করবে:
* LiveKit Egress সার্ভিস ব্যবহার করে সার্ভার-সাইড রেকর্ডিং অথবা ব্রাউজারের `MediaRecorder API` দিয়ে ক্লায়েন্ট সাইড লোকাল রেকর্ডিং।

---

## ৫. সিকিউরিটি: এন্ড-টু-এন্ড এনক্রিপশন (E2EE) 🔒

### কেন দরকার?
* ডাটাবেজ অ্যাডমিন বা সার্ভার প্রোভাইডারও যেন প্রাইভেট চ্যাট পড়তে না পারে।

### কীভাবে করবে:
* ব্রাউজারের নেটিভ **Web Crypto API** এবং **Signal Protocol (libsignal)** ব্যবহার করে মেসেজ লোকালি এনক্রিপ্ট করে সার্ভারে পাঠানো এবং রিসিভারের প্রাইভেট কী দিয়ে ডিক্রিপ্ট করা।

---

## ৬. ব্যাকগ্রাউন্ড পুশ নোটিফিকেশন (Push Notifications & Service Workers) 🔔

### কেন দরকার?
* ব্রাউজার ট্যাব বন্ধ থাকলেও ইনকামিং কল আসলে মোবাইলে/ডেস্কটপে রিংটোনসহ পপআপ আসা।

### কীভাবে করবে:
* **Web Push Protocol** এবং **Service Worker** (`sw.js`) কনফিগার করা ও NestJS থেকে `web-push` লাইব্রেরি দিয়ে নোটিফিকেশন পাঠানো।

---

## ৭. চ্যাট পেজিনেশন ও মেসেজ হিস্ট্রি অপ্টিমাইজেশন (Infinite Scroll / Cursor Pagination) 📜

### কেন দরকার?
* কোনো কনভারসেশনে ৫,০০০+ মেসেজ থাকলে একবারে সব লোড না করে স্ক্রল করার সাথে সাথে ধাপে ধাপে ২০টি করে মেসেজ লোড করা।

### কীভাবে করবে:
* Prisma-তে `cursor` বা `take` & `skip` ব্যবহার করে ইনফিনিট স্ক্রলিং ইমপ্লিমেন্ট করা।
