const url = 'https://wminzezolovkswuqwmnq.supabase.co/storage/v1/object/public/transcripts/ticket-f67721ce-68f1-415e-8e9f-e002448408bb-1722631202354.html';
fetch(url).then(res => {
  console.log("Content-Type:", res.headers.get('content-type'));
});
