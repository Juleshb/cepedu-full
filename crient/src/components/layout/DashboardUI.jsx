import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

export function DashboardWelcome({
  eyebrow = "Dashboard",
  title,
  description,
  actions = [],
}) {
  return (
    <motion.section
      className="relative overflow-hidden border border-stone-line bg-primary text-white"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 15% 20%, rgba(196,163,90,0.35), transparent 45%), radial-gradient(ellipse at 90% 80%, rgba(255,255,255,0.08), transparent 40%)",
        }}
        aria-hidden
      />
      <div className="relative flex flex-col gap-6 px-6 py-7 md:flex-row md:items-end md:justify-between md:px-8 md:py-8">
        <div className="max-w-2xl">
          <p className="text-xs font-normal uppercase tracking-[0.22em] text-accent-soft">
            {eyebrow}
          </p>
          <h2 className="display-lg mt-2">{title}</h2>
          {description && (
            <p className="mt-3 max-w-xl text-base font-normal leading-relaxed text-white/75">
              {description}
            </p>
          )}
        </div>
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-normal text-white transition hover:bg-white/15"
              >
                {action.icon && <Icon icon={action.icon} width="16" height="16" />}
                {action.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}

export function MetricStrip({ metrics, columns = 4 }) {
  const colClass =
    columns === 3
      ? "grid-cols-1 sm:grid-cols-3"
      : "grid-cols-2 lg:grid-cols-4";

  return (
    <motion.section
      className={`metric-strip ${colClass}`}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.07 } },
      }}
    >
      {metrics.map((metric, index) => {
        const borders =
          columns === 3
            ? index > 0
              ? "border-t sm:border-t-0 sm:border-l"
              : ""
            : [
                index % 2 === 1 ? "border-l" : "",
                index >= 2 ? "border-t lg:border-t-0" : "",
                index >= 1 ? "lg:border-l" : "",
              ]
                .filter(Boolean)
                .join(" ");

        return (
        <motion.div
          key={metric.label}
          className={`metric-cell ${borders}`}
          variants={fadeUp}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-stone-mute">
              {metric.label}
            </p>
            {metric.icon && (
              <Icon
                icon={metric.icon}
                width="18"
                height="18"
                className="text-primary/70"
              />
            )}
          </div>
          <p className="mt-3 text-2xl font-normal tracking-tight text-stone-ink md:text-[1.65rem]">
            {metric.value}
          </p>
          {metric.hint && (
            <p className="mt-1.5 text-xs text-stone-mute">{metric.hint}</p>
          )}
        </motion.div>
        );
      })}
    </motion.section>
  );
}

export function Panel({ title, subtitle, action, children, className = "" }) {
  return (
    <section
      className={`overflow-hidden rounded-[1.25rem] border border-stone-line bg-stone-panel ${className}`}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-line px-5 py-4">
          <div>
            {title && (
              <h3 className="text-lg font-normal tracking-tight text-stone-ink">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-sm font-normal text-stone-mute">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function SectionHeading({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="display-md text-stone-ink">{title}</h2>
      {subtitle && (
        <p className="mt-1 text-sm font-normal text-stone-mute">{subtitle}</p>
      )}
    </div>
  );
}
