(function(){
  'use strict';
  var url=window.TSA_SUPABASE_URL;
  var key=window.TSA_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key) throw new Error('Supabase configuration is missing.');
  if(!window.supabase||typeof window.supabase.createClient!=='function') throw new Error('Supabase client library failed to load.');
  window.tsaSupabase=window.supabase.createClient(url,key,{
    auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}
  });
})();
