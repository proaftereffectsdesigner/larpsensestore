fetch('https://wminzezolovkswuqwmnq.supabase.co/storage/v1/object/public/transcripts/test-blob.html', { method: 'HEAD' })
  .then(res => {
    console.log("Content-Type:", res.headers.get('content-type'));
    console.log("Content-Disposition:", res.headers.get('content-disposition'));
  });
