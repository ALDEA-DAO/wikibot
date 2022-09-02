--
-- PostgreSQL database dump
--

-- Dumped from database version 14.5 (Ubuntu 14.5-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.5 (Ubuntu 14.5-0ubuntu0.22.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: allowed_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.allowed_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.allowed_id_seq OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: allowed; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.allowed (
    id integer DEFAULT nextval('public.allowed_id_seq'::regclass) NOT NULL,
    stake character varying(200) DEFAULT NULL::character varying,
    q character varying(200) DEFAULT NULL::character varying,
    claimed boolean DEFAULT false,
    qgenesis integer,
    qgovernance integer
);


ALTER TABLE public.allowed OWNER TO postgres;

--
-- Name: claim_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.claim_requests (
    id integer NOT NULL,
    requester character varying(200) NOT NULL,
    valid boolean DEFAULT false,
    sent bigint NOT NULL,
    q bigint DEFAULT 0,
    returnamt bigint,
    fee integer DEFAULT 0 NOT NULL,
    utxo character varying(200) DEFAULT NULL::character varying,
    error boolean DEFAULT false,
    processed boolean DEFAULT false,
    tx_id text
);


ALTER TABLE public.claim_requests OWNER TO postgres;

--
-- Name: claim_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.claim_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.claim_requests_id_seq OWNER TO postgres;

--
-- Name: claim_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.claim_requests_id_seq OWNED BY public.claim_requests.id;


--
-- Name: discarded; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.discarded (
    id integer NOT NULL,
    asset character varying(200) DEFAULT NULL::character varying,
    name character varying(200) DEFAULT NULL::character varying,
    type character varying(20) DEFAULT NULL::character varying,
    payment character varying(200) DEFAULT NULL::character varying
);


ALTER TABLE public.discarded OWNER TO postgres;

--
-- Name: discarded_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.discarded_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.discarded_id_seq OWNER TO postgres;

--
-- Name: discarded_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.discarded_id_seq OWNED BY public.discarded.id;


--
-- Name: snapshot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.snapshot (
    id integer NOT NULL,
    asset character varying(200) DEFAULT NULL::character varying,
    name character varying(200) DEFAULT NULL::character varying,
    type character varying(20) DEFAULT NULL::character varying,
    payment character varying(200) DEFAULT NULL::character varying,
    stake character varying(200) DEFAULT NULL::character varying
);


ALTER TABLE public.snapshot OWNER TO postgres;

--
-- Name: snapshot_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.snapshot_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.snapshot_id_seq OWNER TO postgres;

--
-- Name: snapshot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.snapshot_id_seq OWNED BY public.snapshot.id;


--
-- Name: claim_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim_requests ALTER COLUMN id SET DEFAULT nextval('public.claim_requests_id_seq'::regclass);


--
-- Name: discarded id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discarded ALTER COLUMN id SET DEFAULT nextval('public.discarded_id_seq'::regclass);


--
-- Name: snapshot id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.snapshot ALTER COLUMN id SET DEFAULT nextval('public.snapshot_id_seq'::regclass);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA public TO claims;


--
-- Name: TABLE allowed; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.allowed TO claims;


--
-- Name: TABLE claim_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.claim_requests TO claims;


--
-- Name: TABLE discarded; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.discarded TO claims;


--
-- Name: TABLE snapshot; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.snapshot TO claims;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES  TO claims;


--
-- PostgreSQL database dump complete
--

